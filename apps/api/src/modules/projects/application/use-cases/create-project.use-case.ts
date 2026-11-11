import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../audit/application/audit-logger';
import { INITIAL_PROJECT_STATUS } from '../../domain/project';
import { ProjectRepository } from '../ports/project.repository';
import type { AdminProjectView, ProjectDetails } from '../project.views';

@Injectable()
export class CreateProjectUseCase {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly audit: AuditLogger,
  ) {}

  /** The author is always the authenticated user; reassigning it is a separate, privileged action. */
  async execute(details: ProjectDetails, actorId: string): Promise<AdminProjectView> {
    const project = await this.projects.create(details, INITIAL_PROJECT_STATUS, actorId);
    await this.audit.log({ actorId, action: 'project.created', entityType: 'Project', entityId: project.id });
    return project;
  }
}
