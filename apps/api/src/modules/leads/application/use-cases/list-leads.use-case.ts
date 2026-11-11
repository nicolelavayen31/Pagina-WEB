import { Injectable } from '@nestjs/common';
import type { Page, PageRequest } from '../../../../common/application/pagination';
import type { LeadStatus } from '../../domain/lead';
import { LeadRepository, type LeadListItem } from '../ports/lead.repository';

@Injectable()
export class ListLeadsUseCase {
  constructor(private readonly leads: LeadRepository) {}

  execute(request: PageRequest, status?: LeadStatus): Promise<Page<LeadListItem>> {
    return this.leads.list(request, status);
  }
}
