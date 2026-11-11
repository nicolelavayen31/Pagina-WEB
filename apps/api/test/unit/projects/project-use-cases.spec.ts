import type { FileStorage } from '../../../src/common/storage/file-storage';
import type { AuditEntry, AuditLogger } from '../../../src/modules/audit/application/audit-logger';
import type { ProjectRepository } from '../../../src/modules/projects/application/ports/project.repository';
import type { AdminProjectView } from '../../../src/modules/projects/application/project.views';
import { AssignProjectAuthorUseCase } from '../../../src/modules/projects/application/use-cases/assign-project-author.use-case';
import { ChangeProjectStatusUseCase } from '../../../src/modules/projects/application/use-cases/change-project-status.use-case';
import { CreateProjectUseCase } from '../../../src/modules/projects/application/use-cases/create-project.use-case';
import { DeleteProjectUseCase } from '../../../src/modules/projects/application/use-cases/delete-project.use-case';
import { UpdateProjectUseCase } from '../../../src/modules/projects/application/use-cases/update-project.use-case';
import { Project, type ProjectStatus } from '../../../src/modules/projects/domain/project';
import {
  CoverImageNotInProjectError,
  InvalidProjectAuthorError,
  ProjectAlreadyPublishedError,
  ProjectNotFoundError,
} from '../../../src/modules/projects/domain/project.errors';
import type { UserDirectory } from '../../../src/modules/users/application/ports/user-directory';

const ACTOR = 'user-1';
const view = (id: string) => ({ id }) as AdminProjectView;

function setup(stored: { status: ProjectStatus; imageIds?: string[] } | null = { status: 'DRAFT' }) {
  const repository = {
    findById: jest.fn(async (id: string) =>
      stored ? Project.restore({ id, status: stored.status, publishedAt: null }) : null,
    ),
    create: jest.fn(async () => view('new-project')),
    update: jest.fn(async (id: string) => view(id)),
    saveStatus: jest.fn(async (project: Project) => view(project.id)),
    assignAuthor: jest.fn(async (id: string) => view(id)),
    hasImage: jest.fn(async (_projectId: string, imageId: string) => (stored?.imageIds ?? []).includes(imageId)),
    imageStorageKeys: jest.fn(async () => ['projects/a.webp', 'projects/b.webp']),
    delete: jest.fn(async () => undefined),
  } satisfies ProjectRepository;

  const auditEntries: AuditEntry[] = [];
  const audit: AuditLogger = { log: async (entry) => void auditEntries.push(entry) };
  const storage = { put: jest.fn(), get: jest.fn(), delete: jest.fn(async () => undefined) } satisfies FileStorage;
  const users = { isActive: jest.fn(async (id: string) => id === 'active-user') } satisfies UserDirectory;

  return { repository, audit, auditEntries, storage, users };
}

describe('Project use cases', () => {
  it('creates every project as a draft authored by the actor', async () => {
    const { repository, audit, auditEntries } = setup();
    const details = { title: 't', slug: 's', summary: 's', description: 'd', category: 'c', location: 'l' };

    await new CreateProjectUseCase(repository, audit).execute(details, ACTOR);

    expect(repository.create).toHaveBeenCalledWith(details, 'DRAFT', ACTOR);
    expect(auditEntries).toEqual([
      { actorId: ACTOR, action: 'project.created', entityType: 'Project', entityId: 'new-project' },
    ]);
  });

  it('publishes through the domain entity and audits the transition', async () => {
    const { repository, audit, auditEntries } = setup({ status: 'DRAFT' });

    await new ChangeProjectStatusUseCase(repository, audit).execute('p-1', 'publish', ACTOR);

    const saved = repository.saveStatus.mock.calls[0][0];
    expect(saved.status).toBe('PUBLISHED');
    expect(saved.publishedAt).toBeInstanceOf(Date);
    expect(auditEntries.map((entry) => entry.action)).toEqual(['project.published']);
  });

  it('does not save nor audit a rejected transition', async () => {
    const { repository, audit, auditEntries } = setup({ status: 'PUBLISHED' });

    await expect(new ChangeProjectStatusUseCase(repository, audit).execute('p-1', 'publish', ACTOR)).rejects.toThrow(
      ProjectAlreadyPublishedError,
    );
    expect(repository.saveStatus).not.toHaveBeenCalled();
    expect(auditEntries).toHaveLength(0);
  });

  it('reports unknown projects as not found', async () => {
    const { repository, audit } = setup(null);
    await expect(new ChangeProjectStatusUseCase(repository, audit).execute('nope', 'archive', ACTOR)).rejects.toThrow(
      ProjectNotFoundError,
    );
  });

  it('only accepts a cover image that belongs to the project', async () => {
    const { repository, audit } = setup({ status: 'DRAFT', imageIds: ['img-1'] });
    const useCase = new UpdateProjectUseCase(repository, audit);

    await expect(useCase.execute('p-1', { coverImageId: 'foreign' }, ACTOR)).rejects.toThrow(CoverImageNotInProjectError);
    await expect(useCase.execute('p-1', { coverImageId: 'img-1' }, ACTOR)).resolves.toEqual(view('p-1'));
  });

  it('only assigns active users as authors', async () => {
    const { repository, audit, users } = setup();
    const useCase = new AssignProjectAuthorUseCase(repository, users, audit);

    await expect(useCase.execute('p-1', 'inactive-user', ACTOR)).rejects.toThrow(InvalidProjectAuthorError);
    await useCase.execute('p-1', 'active-user', ACTOR);
    expect(repository.assignAuthor).toHaveBeenCalledWith('p-1', 'active-user', ACTOR);
  });

  it('deletes the project even when a stored file cannot be removed', async () => {
    const { repository, audit, auditEntries, storage } = setup();
    storage.delete.mockRejectedValueOnce(new Error('disk error'));
    const useCase = new DeleteProjectUseCase(repository, storage, audit);
    jest.spyOn(useCase['logger'], 'error').mockImplementation(() => undefined);

    await expect(useCase.execute('p-1', ACTOR)).resolves.toEqual({ success: true });

    expect(repository.delete).toHaveBeenCalledWith('p-1');
    expect(storage.delete).toHaveBeenCalledTimes(2);
    expect(auditEntries[0]).toMatchObject({ action: 'project.deleted', metadata: { images: 2 } });
  });
});
