import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../audit/application/audit-logger';
import type { LeadStatus } from '../../domain/lead';
import { LeadNotFoundError } from '../../domain/lead.errors';
import { LeadRepository, type LeadView } from '../ports/lead.repository';

@Injectable()
export class UpdateLeadStatusUseCase {
  constructor(
    private readonly leads: LeadRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(id: string, status: LeadStatus, actorId: string): Promise<LeadView> {
    const previous = await this.leads.findStatus(id);
    if (!previous) {
      throw new LeadNotFoundError();
    }

    const lead = await this.leads.updateStatus(id, status);
    await this.audit.log({
      actorId,
      action: 'lead.status_changed',
      entityType: 'Lead',
      entityId: id,
      metadata: { from: previous, to: status },
    });
    return lead;
  }
}
