export type AuditAction =
  | 'auth.login'
  | 'project.created'
  | 'project.updated'
  | 'project.published'
  | 'project.unpublished'
  | 'project.archived'
  | 'project.author_assigned'
  | 'project.deleted'
  | 'media.uploaded'
  | 'media.deleted'
  | 'service.created'
  | 'service.updated'
  | 'lead.status_changed'
  | 'user.created'
  | 'user.updated';

export type AuditEntityType = 'Session' | 'Project' | 'ProjectImage' | 'Service' | 'Lead' | 'User';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type AuditEntry = {
  actorId: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  metadata?: Record<string, JsonValue>;
};

/**
 * Port used by every module to record who did what. Implementations must never throw:
 * a failed audit write is logged but does not break the operation being audited.
 */
export abstract class AuditLogger {
  abstract log(entry: AuditEntry): Promise<void>;
}
