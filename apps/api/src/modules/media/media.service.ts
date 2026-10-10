import { Injectable, Logger, NotFoundException, UnsupportedMediaTypeException } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { detectImageType } from './image-validation';
import { StorageService } from './storage/storage.service';

const MAX_DIMENSION = 2400;
const MAX_INPUT_PIXELS = 40_000_000;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
  ) {}

  /**
   * Re-encodes every upload to WebP. This drops EXIF/GPS metadata and anything that is not
   * pixel data, so polyglot files cannot survive the round trip.
   */
  async processImage(buffer: Buffer) {
    if (!detectImageType(buffer)) {
      throw new UnsupportedMediaTypeException('Formato no permitido. Use JPEG, PNG o WebP.');
    }
    try {
      const { data, info } = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' })
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      return { data, width: info.width, height: info.height };
    } catch {
      throw new UnsupportedMediaTypeException('La imagen está dañada o no es válida.');
    }
  }

  async upload(
    projectId: string,
    file: Buffer,
    meta: { altText?: string; caption?: string },
    actorId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, coverImageId: true },
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const processed = await this.processImage(file);
    const id = randomUUID();
    const storageKey = `projects/${projectId}/${id}.webp`;

    await this.storage.put(storageKey, processed.data, 'image/webp');

    try {
      const last = await this.prisma.projectImage.aggregate({ where: { projectId }, _max: { sortOrder: true } });
      const image = await this.prisma.projectImage.create({
        data: {
          id,
          projectId,
          storageKey,
          mimeType: 'image/webp',
          sizeBytes: processed.data.length,
          width: processed.width,
          height: processed.height,
          altText: meta.altText || null,
          caption: meta.caption || null,
          sortOrder: (last._max.sortOrder ?? -1) + 1,
        },
        select: { id: true, altText: true, caption: true, sortOrder: true, width: true, height: true, sizeBytes: true },
      });

      if (!project.coverImageId) {
        await this.prisma.project.update({ where: { id: projectId }, data: { coverImageId: id } });
      }

      await this.audit.log(actorId, 'media.uploaded', 'ProjectImage', id, { projectId });
      return image;
    } catch (error) {
      await this.storage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async remove(projectId: string, imageId: string, actorId: string) {
    const image = await this.prisma.projectImage.findFirst({
      where: { id: imageId, projectId },
      select: { id: true, storageKey: true },
    });
    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    await this.prisma.projectImage.delete({ where: { id: imageId } });
    await this.storage.delete(image.storageKey).catch((error: Error) => {
      this.logger.error(`Could not delete stored file ${image.storageKey}`, error.stack);
    });
    await this.audit.log(actorId, 'media.deleted', 'ProjectImage', imageId, { projectId });
    return { success: true };
  }

  /**
   * Images of published projects are public. Images of drafts are only served to staff
   * with `project:read`; everyone else gets the same 404 as for a missing image.
   */
  async getForDelivery(imageId: string, sessionToken: string | undefined) {
    const image = await this.prisma.projectImage.findUnique({
      where: { id: imageId },
      select: { storageKey: true, project: { select: { status: true } } },
    });
    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    const isPublic = image.project.status === ProjectStatus.PUBLISHED;
    if (!isPublic) {
      const user = await this.auth.resolveSession(sessionToken);
      if (!user || !user.permissions.includes('project:read')) {
        throw new NotFoundException('Imagen no encontrada');
      }
    }

    const data = await this.storage.get(image.storageKey);
    if (!data) {
      throw new NotFoundException('Imagen no encontrada');
    }
    return { data, isPublic };
  }
}
