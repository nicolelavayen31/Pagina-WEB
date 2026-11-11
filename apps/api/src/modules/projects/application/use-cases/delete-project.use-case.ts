import { Injectable, Logger } from '@nestjs/common';
import { FileStorage } from '../../../../common/storage/file-storage';
import { AuditLogger } from '../../../audit/application/audit-logger';
import { ProjectRepository } from '../ports/project.repository';
import { loadProject } from './load-project';

@Injectable()
export class DeleteProjectUseCase {
  private readonly logger = new Logger(DeleteProjectUseCase.name);

  constructor(
    private readonly projects: ProjectRepository,
    private readonly storage: FileStorage,
    private readonly audit: AuditLogger,
  ) {}

  /**
   * Rows go first (images cascade in the database); files are removed afterwards on a best-effort
   * basis, so a storage failure can leave an orphan file but never a row pointing to a missing file.
   */
  async execute(id: string, actorId: string): Promise<{ success: true }> {
    await loadProject(this.projects, id);
    const storageKeys = await this.projects.imageStorageKeys(id);

    await this.projects.delete(id);
    await this.deleteFiles(storageKeys);

    await this.audit.log({
      actorId,
      action: 'project.deleted',
      entityType: 'Project',
      entityId: id,
      metadata: { images: storageKeys.length },
    });
    return { success: true };
  }

  private async deleteFiles(storageKeys: string[]): Promise<void> {
    for (const key of storageKeys) {
      await this.storage.delete(key).catch((error: Error) => {
        this.logger.error(`Could not delete stored file ${key}`, error.stack);
      });
    }
  }
}
