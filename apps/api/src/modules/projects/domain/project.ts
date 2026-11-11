import { ProjectAlreadyArchivedError, ProjectAlreadyPublishedError, ProjectNotPublishedError } from './project.errors';

export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/** Every project starts as a draft; status is never taken from client input. */
export const INITIAL_PROJECT_STATUS: ProjectStatus = 'DRAFT';

export type ProjectState = { id: string; status: ProjectStatus; publishedAt: Date | null };

/**
 * Publication lifecycle of a project:
 * DRAFT/ARCHIVED -> PUBLISHED, PUBLISHED -> DRAFT, any -> ARCHIVED.
 */
export class Project {
  private constructor(
    readonly id: string,
    private currentStatus: ProjectStatus,
    private currentPublishedAt: Date | null,
  ) {}

  static restore(state: ProjectState): Project {
    return new Project(state.id, state.status, state.publishedAt);
  }

  get status(): ProjectStatus {
    return this.currentStatus;
  }

  get publishedAt(): Date | null {
    return this.currentPublishedAt;
  }

  publish(now: Date): void {
    if (this.currentStatus === 'PUBLISHED') {
      throw new ProjectAlreadyPublishedError();
    }
    this.currentStatus = 'PUBLISHED';
    this.currentPublishedAt = now;
  }

  unpublish(): void {
    if (this.currentStatus !== 'PUBLISHED') {
      throw new ProjectNotPublishedError();
    }
    this.currentStatus = 'DRAFT';
    this.currentPublishedAt = null;
  }

  /** Keeps `publishedAt` as a historical record of the last publication. */
  archive(): void {
    if (this.currentStatus === 'ARCHIVED') {
      throw new ProjectAlreadyArchivedError();
    }
    this.currentStatus = 'ARCHIVED';
  }
}
