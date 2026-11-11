import type { Project } from '../../domain/project';
import { ProjectNotFoundError } from '../../domain/project.errors';
import type { ProjectRepository } from '../ports/project.repository';

export async function loadProject(repository: ProjectRepository, id: string): Promise<Project> {
  const project = await repository.findById(id);
  if (!project) {
    throw new ProjectNotFoundError();
  }
  return project;
}
