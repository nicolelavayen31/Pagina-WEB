import type { ProjectStatus } from '../../../projects/domain/project';

export type ProjectCounts = Record<ProjectStatus, number>;

export abstract class DashboardStats {
  /** Statuses without projects are reported as 0. */
  abstract projectCounts(): Promise<ProjectCounts>;
  abstract leadCounts(): Promise<{ total: number; new: number }>;
  abstract serviceCounts(): Promise<{ total: number; active: number }>;
}
