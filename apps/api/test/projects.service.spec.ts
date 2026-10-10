import { ProjectsService } from '../src/modules/projects/projects.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProjectStatus } from '@prisma/client';

describe('ProjectsService', () => {
  it('publishes a valid project and sets the publication date', async () => {
    const prisma = {
      project: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'project-1',
          title: 'Proyecto',
          summary: 'Resumen válido',
          description: 'Descripción válida larga',
          category: 'Mantenimiento',
          location: 'Quito',
        }),
        update: jest.fn().mockImplementation(async ({ data }) => ({ id: 'project-1', status: data.status, publishedAt: data.publishedAt })),
      },
    } as unknown as PrismaService;

    const service = new ProjectsService(prisma);
    const result = await service.publish('project-1', 'user-1');

    expect(result.status).toBe(ProjectStatus.PUBLISHED);
    expect(result.publishedAt).toBeInstanceOf(Date);
  });
});
