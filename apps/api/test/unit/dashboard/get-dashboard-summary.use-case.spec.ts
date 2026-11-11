import { GetDashboardSummaryUseCase } from '../../../src/modules/dashboard/application/get-dashboard-summary.use-case';
import type { DashboardStats } from '../../../src/modules/dashboard/application/ports/dashboard-stats';

function setup() {
  const stats = {
    projectCounts: jest.fn(async () => ({ DRAFT: 2, PUBLISHED: 3, ARCHIVED: 1 })),
    leadCounts: jest.fn(async () => ({ total: 7, new: 4 })),
    serviceCounts: jest.fn(async () => ({ total: 6, active: 5 })),
  } satisfies DashboardStats;
  return { stats, useCase: new GetDashboardSummaryUseCase(stats) };
}

describe('GetDashboardSummaryUseCase', () => {
  it('returns every block for a user who may read everything', async () => {
    const { useCase } = setup();

    await expect(useCase.execute(['project:read', 'lead:read', 'service:read'])).resolves.toEqual({
      projects: { DRAFT: 2, PUBLISHED: 3, ARCHIVED: 1, total: 6 },
      leads: { total: 7, new: 4 },
      services: { total: 6, active: 5 },
    });
  });

  it('does not even query the blocks the user may not read', async () => {
    const { useCase, stats } = setup();

    const summary = await useCase.execute(['project:read']);

    expect(summary.leads).toBeNull();
    expect(summary.services).toBeNull();
    expect(stats.leadCounts).not.toHaveBeenCalled();
    expect(stats.serviceCounts).not.toHaveBeenCalled();
  });
});
