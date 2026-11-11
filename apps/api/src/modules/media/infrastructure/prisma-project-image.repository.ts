import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/persistence/prisma.service';
import type {
  DeliverableImage,
  NewProjectImage,
  ProjectImageRepository,
  ProjectImageView,
} from '../application/ports/project-image.repository';

const imageViewSelect = {
  id: true,
  altText: true,
  caption: true,
  sortOrder: true,
  width: true,
  height: true,
  sizeBytes: true,
} as const;

@Injectable()
export class PrismaProjectImageRepository implements ProjectImageRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProjectCover(projectId: string): Promise<{ coverImageId: string | null } | null> {
    return this.prisma.project.findUnique({ where: { id: projectId }, select: { coverImageId: true } });
  }

  async maxSortOrder(projectId: string): Promise<number | null> {
    const result = await this.prisma.projectImage.aggregate({ where: { projectId }, _max: { sortOrder: true } });
    return result._max.sortOrder;
  }

  add(image: NewProjectImage): Promise<ProjectImageView> {
    return this.prisma.projectImage.create({ data: image, select: imageViewSelect });
  }

  async setCover(projectId: string, imageId: string): Promise<void> {
    await this.prisma.project.update({ where: { id: projectId }, data: { coverImageId: imageId } });
  }

  async findStorageKey(projectId: string, imageId: string): Promise<string | null> {
    const image = await this.prisma.projectImage.findFirst({
      where: { id: imageId, projectId },
      select: { storageKey: true },
    });
    return image?.storageKey ?? null;
  }

  async delete(imageId: string): Promise<void> {
    await this.prisma.projectImage.delete({ where: { id: imageId } });
  }

  async findDeliverable(imageId: string): Promise<DeliverableImage | null> {
    const image = await this.prisma.projectImage.findUnique({
      where: { id: imageId },
      select: { storageKey: true, project: { select: { status: true } } },
    });
    return image ? { storageKey: image.storageKey, projectIsPublished: image.project.status === 'PUBLISHED' } : null;
  }
}
