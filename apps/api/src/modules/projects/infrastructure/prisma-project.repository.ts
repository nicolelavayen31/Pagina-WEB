import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/persistence/prisma.service';
import type { ProjectRepository } from '../application/ports/project.repository';
import type { AdminProjectView, ProjectChanges, ProjectDetails } from '../application/project.views';
import { Project, type ProjectStatus } from '../domain/project';
import { adminProjectInclude } from './project.prisma-queries';

@Injectable()
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Project | null> {
    const row = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true, status: true, publishedAt: true },
    });
    return row ? Project.restore(row) : null;
  }

  create(details: ProjectDetails, status: ProjectStatus, authorId: string): Promise<AdminProjectView> {
    return this.prisma.project.create({
      data: { ...details, status, createdById: authorId, updatedById: authorId },
      include: adminProjectInclude,
    });
  }

  update(id: string, changes: ProjectChanges, actorId: string): Promise<AdminProjectView> {
    return this.updateAndRead(id, { ...changes, updatedById: actorId });
  }

  saveStatus(project: Project, actorId: string): Promise<AdminProjectView> {
    return this.updateAndRead(project.id, {
      status: project.status,
      publishedAt: project.publishedAt,
      updatedById: actorId,
    });
  }

  assignAuthor(id: string, authorId: string, actorId: string): Promise<AdminProjectView> {
    return this.updateAndRead(id, { createdById: authorId, updatedById: actorId });
  }

  async hasImage(projectId: string, imageId: string): Promise<boolean> {
    const image = await this.prisma.projectImage.findFirst({ where: { id: imageId, projectId }, select: { id: true } });
    return image !== null;
  }

  async imageStorageKeys(projectId: string): Promise<string[]> {
    const images = await this.prisma.projectImage.findMany({ where: { projectId }, select: { storageKey: true } });
    return images.map((image) => image.storageKey);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({ where: { id } });
  }

  private updateAndRead(id: string, data: Prisma.ProjectUncheckedUpdateInput): Promise<AdminProjectView> {
    return this.prisma.project.update({ where: { id }, data, include: adminProjectInclude });
  }
}
