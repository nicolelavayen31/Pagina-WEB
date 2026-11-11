import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../audit/application/audit-logger';
import { CoverImageNotInProjectError } from '../../domain/project.errors';
import { ProjectRepository } from '../ports/project.repository';
import type { AdminProjectView, ProjectChanges } from '../project.views';
import { loadProject } from './load-project';

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(id: string, changes: ProjectChanges, actorId: string): Promise<AdminProjectView> {
    await loadProject(this.projects, id);

    if (changes.coverImageId && !(await this.projects.hasImage(id, changes.coverImageId))) {
      throw new CoverImageNotInProjectError();
    }

    const project = await this.projects.update(id, changes, actorId);
    await this.audit.log({
      actorId,
      action: 'project.updated',
      entityType: 'Project',
      entityId: id,
      metadata: { fields: Object.keys(changes) },
    });
    return project;
  }
}
