import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import type { ProjectCreateInput, ProjectUpdateInput } from '@repo/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../media/storage/storage.service';

const imageOrder = [{ sortOrder: 'asc' }, { createdAt: 'asc' }] satisfies Prisma.ProjectImageOrderByWithRelationInput[];

/** Public responses never include authorship, internal ids or storage keys. */
export const publicProjectSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  description: true,
  category: true,
  location: true,
  publishedAt: true,
  coverImageId: true,
  images: { select: { id: true, altText: true, caption: true, sortOrder: true }, orderBy: imageOrder },
} satisfies Prisma.ProjectSelect;

const adminProjectInclude = {
  images: {
    select: { id: true, altText: true, caption: true, sortOrder: true, width: true, height: true, sizeBytes: true },
    orderBy: imageOrder,
  },
  creator: { select: { id: true, name: true, email: true } },
  updater: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ProjectInclude;

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  async listPublic(page: number, pageSize: number) {
    const where = { status: ProjectStatus.PUBLISHED };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        select: publicProjectSelect,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.project.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findPublicBySlug(slug: string) {
    const project = await this.prisma.project.findFirst({
      where: { slug, status: ProjectStatus.PUBLISHED },
      select: publicProjectSelect,
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  async listAdmin(page: number, pageSize: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        orderBy: { updatedAt: 'desc' },
        include: adminProjectInclude,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.project.count(),
    ]);
    return { items, total, page, pageSize };
  }

  async findAdminById(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id }, include: adminProjectInclude });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  async create(input: ProjectCreateInput, userId: string) {
    const project = await this.prisma.project.create({
      data: { ...input, status: ProjectStatus.DRAFT, createdById: userId, updatedById: userId },
      include: adminProjectInclude,
    });
    await this.audit.log(userId, 'project.created', 'Project', project.id);
    return project;
  }

  async update(id: string, input: ProjectUpdateInput, userId: string) {
    await this.getOrThrow(id);

    if (input.coverImageId) {
      const image = await this.prisma.projectImage.findFirst({
        where: { id: input.coverImageId, projectId: id },
        select: { id: true },
      });
      if (!image) {
        throw new BadRequestException({ statusCode: 400, message: 'La portada debe ser una imagen del proyecto' });
      }
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: { ...input, updatedById: userId },
      include: adminProjectInclude,
    });
    await this.audit.log(userId, 'project.updated', 'Project', id, { fields: Object.keys(input) });
    return project;
  }

  async publish(id: string, userId: string) {
    const project = await this.getOrThrow(id);
    if (project.status === ProjectStatus.PUBLISHED) {
      throw new ConflictException('El proyecto ya está publicado');
    }
    return this.changeStatus(id, userId, 'project.published', {
      status: ProjectStatus.PUBLISHED,
      publishedAt: new Date(),
    });
  }

  async unpublish(id: string, userId: string) {
    const project = await this.getOrThrow(id);
    if (project.status !== ProjectStatus.PUBLISHED) {
      throw new ConflictException('Solo se pueden despublicar proyectos publicados');
    }
    return this.changeStatus(id, userId, 'project.unpublished', { status: ProjectStatus.DRAFT, publishedAt: null });
  }

  async archive(id: string, userId: string) {
    const project = await this.getOrThrow(id);
    if (project.status === ProjectStatus.ARCHIVED) {
      throw new ConflictException('El proyecto ya está archivado');
    }
    return this.changeStatus(id, userId, 'project.archived', { status: ProjectStatus.ARCHIVED });
  }

  async assignAuthor(id: string, authorId: string, actorId: string) {
    await this.getOrThrow(id);
    const author = await this.prisma.user.findFirst({ where: { id: authorId, isActive: true }, select: { id: true } });
    if (!author) {
      throw new BadRequestException({ statusCode: 400, message: 'El autor indicado no existe o está inactivo' });
    }
    const project = await this.prisma.project.update({
      where: { id },
      data: { createdById: authorId, updatedById: actorId },
      include: adminProjectInclude,
    });
    await this.audit.log(actorId, 'project.author_assigned', 'Project', id, { authorId });
    return project;
  }

  async remove(id: string, userId: string) {
    await this.getOrThrow(id);
    const images = await this.prisma.projectImage.findMany({ where: { projectId: id }, select: { storageKey: true } });

    await this.prisma.project.delete({ where: { id } });

    for (const image of images) {
      await this.storage.delete(image.storageKey).catch((error: Error) => {
        this.logger.error(`Could not delete stored file ${image.storageKey}`, error.stack);
      });
    }

    await this.audit.log(userId, 'project.deleted', 'Project', id, { images: images.length });
    return { success: true };
  }

  private async getOrThrow(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  private async changeStatus(id: string, userId: string, action: string, data: Prisma.ProjectUpdateInput) {
    const project = await this.prisma.project.update({
      where: { id },
      data: { ...data, updater: { connect: { id: userId } } },
      include: adminProjectInclude,
    });
    await this.audit.log(userId, action, 'Project', id);
    return project;
  }
}
