import { ConflictException } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { ProjectsService } from '../../src/modules/projects/projects.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/modules/audit/audit.service';
import { StorageService } from '../../src/modules/media/storage/storage.service';

function buildService(status: ProjectStatus) {
  const update = jest.fn().mockImplementation(async ({ data }) => ({ id: 'project-1', ...data }));
  const prisma = {
    project: {
      findUnique: jest.fn().mockResolvedValue({ id: 'project-1', status }),
      update,
    },
  } as unknown as PrismaService;
  const audit = { log: jest.fn() } as unknown as AuditService;
  const storage = { delete: jest.fn() } as unknown as StorageService;
  return { service: new ProjectsService(prisma, audit, storage), update, audit };
}

describe('ProjectsService', () => {
  it('publishes a draft, sets the publication date and audits it', async () => {
    const { service, update, audit } = buildService(ProjectStatus.DRAFT);

    const result = await service.publish('project-1', 'user-1');

    expect(result.status).toBe(ProjectStatus.PUBLISHED);
    expect(result.publishedAt).toBeInstanceOf(Date);
    expect(update.mock.calls[0][0].data.updater).toEqual({ connect: { id: 'user-1' } });
    expect(audit.log).toHaveBeenCalledWith('user-1', 'project.published', 'Project', 'project-1');
  });

  it('refuses to publish an already published project', async () => {
    const { service } = buildService(ProjectStatus.PUBLISHED);
    await expect(service.publish('project-1', 'user-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('unpublishing clears the publication date', async () => {
    const { service } = buildService(ProjectStatus.PUBLISHED);
    const result = await service.unpublish('project-1', 'user-1');
    expect(result).toMatchObject({ status: ProjectStatus.DRAFT, publishedAt: null });
  });

  it('only published projects can be unpublished', async () => {
    const { service } = buildService(ProjectStatus.DRAFT);
    await expect(service.unpublish('project-1', 'user-1')).rejects.toBeInstanceOf(ConflictException);
  });
});
