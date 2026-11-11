import { Project, type ProjectStatus } from '../../../src/modules/projects/domain/project';
import {
  ProjectAlreadyArchivedError,
  ProjectAlreadyPublishedError,
  ProjectNotPublishedError,
} from '../../../src/modules/projects/domain/project.errors';

const LAST_PUBLICATION = new Date('2026-01-01T00:00:00Z');

function projectIn(status: ProjectStatus) {
  return Project.restore({ id: 'p-1', status, publishedAt: status === 'DRAFT' ? null : LAST_PUBLICATION });
}

describe('Project lifecycle', () => {
  it.each<ProjectStatus>(['DRAFT', 'ARCHIVED'])('publishes from %s and stamps the publication date', (status) => {
    const project = projectIn(status);
    const now = new Date('2026-11-11T10:00:00Z');

    project.publish(now);

    expect(project.status).toBe('PUBLISHED');
    expect(project.publishedAt).toBe(now);
  });

  it('refuses to publish twice', () => {
    expect(() => projectIn('PUBLISHED').publish(new Date())).toThrow(ProjectAlreadyPublishedError);
  });

  it('unpublishing returns to draft and clears the publication date', () => {
    const project = projectIn('PUBLISHED');
    project.unpublish();
    expect(project.status).toBe('DRAFT');
    expect(project.publishedAt).toBeNull();
  });

  it.each<ProjectStatus>(['DRAFT', 'ARCHIVED'])('only published projects can be unpublished (%s fails)', (status) => {
    expect(() => projectIn(status).unpublish()).toThrow(ProjectNotPublishedError);
  });

  it('archiving keeps the last publication date', () => {
    const project = projectIn('PUBLISHED');
    project.archive();
    expect(project.status).toBe('ARCHIVED');
    expect(project.publishedAt).toBe(LAST_PUBLICATION);
  });

  it('refuses to archive twice', () => {
    expect(() => projectIn('ARCHIVED').archive()).toThrow(ProjectAlreadyArchivedError);
  });
});
