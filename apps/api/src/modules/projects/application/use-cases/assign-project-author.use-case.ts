import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../audit/application/audit-logger';
import { UserDirectory } from '../../../users/application/ports/user-directory';
import { InvalidProjectAuthorError } from '../../domain/project.errors';
import { ProjectRepository } from '../ports/project.repository';
import type { AdminProjectView } from '../project.views';
import { loadProject } from './load-project';

@Injectable()
export class AssignProjectAuthorUseCase {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly users: UserDirectory,
    private readonly audit: AuditLogger,
  ) {}

  async execute(id: string, authorId: string, actorId: string): Promise<AdminProjectView> {
    await loadProject(this.projects, id);

    if (!(await this.users.isActive(authorId))) {
      throw new InvalidProjectAuthorError();
    }

    const project = await this.projects.assignAuthor(id, authorId, actorId);
    await this.audit.log({
      actorId,
      action: 'project.author_assigned',
      entityType: 'Project',
      entityId: id,
      metadata: { authorId },
    });
    return project;
  }
}
