import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FileStorage } from '../../../../common/storage/file-storage';
import { AuditLogger } from '../../../audit/application/audit-logger';
import { ProjectNotFoundError } from '../../../projects/domain/project.errors';
import { detectImageType } from '../../domain/image-format';
import { UnsupportedImageFormatError } from '../../domain/media.errors';
import { nextSortOrder, projectImageStorageKey, STORED_IMAGE_TYPE } from '../../domain/project-image';
import { ImageProcessor } from '../ports/image-processor';
import { ProjectImageRepository, type ProjectImageView } from '../ports/project-image.repository';

export type UploadProjectImageCommand = {
  projectId: string;
  file: Buffer;
  altText?: string;
  caption?: string;
};

@Injectable()
export class UploadProjectImageUseCase {
  constructor(
    private readonly images: ProjectImageRepository,
    private readonly processor: ImageProcessor,
    private readonly storage: FileStorage,
    private readonly audit: AuditLogger,
  ) {}

  /**
   * The real format is detected from the file signature (extension and declared MIME type are
   * ignored) and the image is re-encoded, so polyglot files cannot survive the round trip.
   */
  async execute(command: UploadProjectImageCommand, actorId: string): Promise<ProjectImageView> {
    const { projectId } = command;
    const project = await this.images.findProjectCover(projectId);
    if (!project) {
      throw new ProjectNotFoundError();
    }
    if (!detectImageType(command.file)) {
      throw new UnsupportedImageFormatError();
    }

    const processed = await this.processor.process(command.file);
    const id = randomUUID();
    const storageKey = projectImageStorageKey(projectId, id);
    await this.storage.put(storageKey, processed.data, STORED_IMAGE_TYPE);

    try {
      const image = await this.images.add({
        id,
        projectId,
        storageKey,
        mimeType: STORED_IMAGE_TYPE,
        sizeBytes: processed.data.length,
        width: processed.width,
        height: processed.height,
        altText: command.altText || null,
        caption: command.caption || null,
        sortOrder: nextSortOrder(await this.images.maxSortOrder(projectId)),
      });
      if (!project.coverImageId) {
        await this.images.setCover(projectId, id);
      }
      await this.audit.log({
        actorId,
        action: 'media.uploaded',
        entityType: 'ProjectImage',
        entityId: id,
        metadata: { projectId },
      });
      return image;
    } catch (error) {
      // Never leave a stored file without its database row.
      await this.storage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }
}
