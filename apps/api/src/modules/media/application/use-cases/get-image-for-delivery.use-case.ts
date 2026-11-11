import { Injectable } from '@nestjs/common';
import { FileStorage } from '../../../../common/storage/file-storage';
import { SessionService } from '../../../auth/application/session.service';
import { ImageNotFoundError } from '../../domain/media.errors';
import { ProjectImageRepository } from '../ports/project-image.repository';

export type DeliveredImage = { data: Buffer; isPublic: boolean };

@Injectable()
export class GetImageForDeliveryUseCase {
  constructor(
    private readonly images: ProjectImageRepository,
    private readonly sessions: SessionService,
    private readonly storage: FileStorage,
  ) {}

  /**
   * Images of published projects are public. Images of drafts are only served to staff
   * with `project:read`; everyone else gets the same 404 as for a missing image.
   */
  async execute(imageId: string, sessionToken: unknown): Promise<DeliveredImage> {
    const image = await this.images.findDeliverable(imageId);
    if (!image) {
      throw new ImageNotFoundError();
    }

    const isPublic = image.projectIsPublished;
    if (!isPublic && !(await this.canReadDrafts(sessionToken))) {
      throw new ImageNotFoundError();
    }

    const data = await this.storage.get(image.storageKey);
    if (!data) {
      throw new ImageNotFoundError();
    }
    return { data, isPublic };
  }

  private async canReadDrafts(sessionToken: unknown): Promise<boolean> {
    const user = await this.sessions.resolve(sessionToken);
    return user?.permissions.includes('project:read') ?? false;
  }
}
