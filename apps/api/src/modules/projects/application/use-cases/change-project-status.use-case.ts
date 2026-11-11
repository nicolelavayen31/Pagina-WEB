import { Injectable } from '@nestjs/common';
import { AuditLogger, type AuditAction } from '../../../audit/application/audit-logger';
import type { Project } from '../../domain/project';
import { ProjectRepository } from '../ports/project.repository';
import type { AdminProjectView } from '../project.views';
import { loadProject } from './load-project';

export type ProjectTransition = 'publish' | 'unpublish' | 'archive';

const TRANSITIONS: Record<ProjectTransition, { apply: (project: Project) => void; action: AuditAction }> = {
  publish: { apply: (project) => project.publish(new Date()), action: 'project.published' },
  unpublish: { apply: (project) => project.unpublish(), action: 'project.unpublished' },
  archive: { apply: (project) => project.archive(), action: 'project.archived' },
};

@Injectable()
export class ChangeProjectStatusUseCase {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(id: string, transition: ProjectTransition, actorId: string): Promise<AdminProjectView> {
    const project = await loadProject(this.projects, id);
    const { apply, action } = TRANSITIONS[transition];

    apply(project);

    const saved = await this.projects.saveStatus(project, actorId);
    await this.audit.log({ actorId, action, entityType: 'Project', entityId: id });
    return saved;
  }
}
