import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async listPublic() {
    return this.prisma.project.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findPublicBySlug(slug: string) {
    const project = await this.prisma.project.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async listAdmin() {
    return this.prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async create(payload: any, userId: string) {
    const slug = payload.slug || this.slugify(payload.title);

    const exists = await this.prisma.project.findUnique({ where: { slug } });
    if (exists) {
      throw new BadRequestException('Project slug already exists');
    }

    return this.prisma.project.create({
      data: {
        ...payload,
        slug,
        createdById: userId,
        updatedById: userId,
        status: payload.status || 'DRAFT',
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async update(id: string, payload: any, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.project.update({
      where: { id },
      data: {
        ...payload,
        updatedById: userId,
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async publish(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    if (!project.title || !project.summary || !project.description || !project.category || !project.location) {
      throw new BadRequestException('Project is missing required fields');
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.PUBLISHED,
        publishedAt: new Date(),
        updatedById: userId,
      },
    });
  }

  async unpublish(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.DRAFT,
        updatedById: userId,
      },
    });
  }

  async archive(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.ARCHIVED,
        updatedById: userId,
      },
    });
  }

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.project.delete({ where: { id } });
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 90);
  }
}
