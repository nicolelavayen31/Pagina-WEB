import type {
  AdminLead,
  AdminProject,
  AdminService,
  AdminUser,
  AuditEntry,
  DashboardSummary,
  PublicProject,
  PublicService,
} from '@repo/contracts';
import type { AuditLogView } from '../../../src/modules/audit/application/audit-log-reader';
import type { DashboardSummary as ApiDashboardSummary } from '../../../src/modules/dashboard/application/get-dashboard-summary.use-case';
import type { LeadListItem } from '../../../src/modules/leads/application/ports/lead.repository';
import type { AdminProjectView, PublicProjectView } from '../../../src/modules/projects/application/project.views';
import type { PublicServiceView, ServiceView } from '../../../src/modules/services/application/ports/service.repository';
import type { UserView } from '../../../src/modules/users/application/ports/user.repository';

/** What `JSON.stringify` turns an API view into: dates become ISO strings. */
type Json<T> = T extends Date
  ? string
  : T extends (infer Item)[]
    ? Json<Item>[]
    : T extends object
      ? { [Key in keyof T]: Json<T[Key]> }
      : T;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type SameKeys<A, B> = Same<keyof A, keyof B>;

/**
 * Compile-time guard (checked by `pnpm typecheck`): the API views and the contracts the web consumes
 * must describe the same JSON. If either side changes alone, this file stops compiling.
 */
const responseContracts: [
  Same<Json<PublicProjectView>, PublicProject>,
  Same<Json<AdminProjectView>, AdminProject>,
  Same<Json<PublicServiceView>, PublicService>,
  Same<Json<ServiceView>, AdminService>,
  Same<Json<LeadListItem>, AdminLead>,
  Same<Json<AuditLogView>, AuditEntry>,
  Same<ApiDashboardSummary, DashboardSummary>,
  // Role names are plain strings in the database; the contract narrows them to known roles.
  SameKeys<Json<UserView>, AdminUser>,
] = [true, true, true, true, true, true, true, true];

describe('response contracts', () => {
  it('API views and @repo/contracts describe the same JSON (checked at compile time)', () => {
    expect(responseContracts.every(Boolean)).toBe(true);
  });
});
