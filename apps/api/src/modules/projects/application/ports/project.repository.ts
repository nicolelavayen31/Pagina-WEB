import type { Project, ProjectStatus } from '../../domain/project';
import type { AdminProjectView, ProjectChanges, ProjectDetails } from '../project.views';

/** Write side of the projects persistence. Mutations return the admin view the API responds with. */
export abstract class ProjectRepository {
  abstract findById(id: string): Promise<Project | null>;
  abstract create(details: ProjectDetails, status: ProjectStatus, authorId: string): Promise<AdminProjectView>;
  abstract update(id: string, changes: ProjectChanges, actorId: string): Promise<AdminProjectView>;
  abstract saveStatus(project: Project, actorId: string): Promise<AdminProjectView>;
  abstract assignAuthor(id: string, authorId: string, actorId: string): Promise<AdminProjectView>;
  abstract hasImage(projectId: string, imageId: string): Promise<boolean>;
  abstract imageStorageKeys(projectId: string): Promise<string[]>;
  abstract delete(id: string): Promise<void>;
}
