import type { Page, PageRequest } from '../../../common/application/pagination';

export type AuditLogView = {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: Date;
  actor: { id: string; name: string; email: string } | null;
};

export abstract class AuditLogReader {
  abstract list(request: PageRequest): Promise<Page<AuditLogView>>;
}
