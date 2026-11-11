import { Injectable, Logger } from '@nestjs/common';
import { FileStorage } from '../../../../common/storage/file-storage';
import { AuditLogger } from '../../../audit/application/audit-logger';
import { ImageNotFoundError } from '../../domain/media.errors';
import { ProjectImageRepository } from '../ports/project-image.repository';

@Injectable()
export class DeleteProjectImageUseCase {
  private readonly logger = new Logger(DeleteProjectImageUseCase.name);

  constructor(
    private readonly images: ProjectImageRepository,
    private readonly storage: FileStorage,
    private readonly audit: AuditLogger,
  ) {}

  async execute(projectId: string, imageId: string, actorId: string): Promise<{ success: true }> {
    const storageKey = await this.images.findStorageKey(projectId, imageId);
    if (!storageKey) {
      throw new ImageNotFoundError();
    }

    await this.images.delete(imageId);
    await this.storage.delete(storageKey).catch((error: Error) => {
      this.logger.error(`Could not delete stored file ${storageKey}`, error.stack);
    });
    await this.audit.log({
      actorId,
      action: 'media.deleted',
      entityType: 'ProjectImage',
      entityId: imageId,
      metadata: { projectId },
    });
    return { success: true };
  }
}
