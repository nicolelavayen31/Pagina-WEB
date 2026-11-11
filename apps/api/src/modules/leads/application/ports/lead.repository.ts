import type { Page, PageRequest } from '../../../../common/application/pagination';
import type { BudgetRange } from '@repo/contracts';
import type { LeadStatus } from '../../domain/lead';

export type NewLead = {
  name: string;
  company: string | null;
  email: string;
  phone: string;
  serviceId: string | null;
  location: string;
  description: string;
  budgetRange: BudgetRange | null;
  privacyNoticeVersion: string;
  consentAt: Date;
};

export type LeadView = Omit<NewLead, 'privacyNoticeVersion' | 'consentAt'> & {
  id: string;
  status: LeadStatus;
  privacyNoticeVersion: string | null;
  consentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LeadListItem = LeadView & { service: { id: string; name: string } | null };

export abstract class LeadRepository {
  abstract create(lead: NewLead): Promise<{ id: string }>;
  abstract list(request: PageRequest, status?: LeadStatus): Promise<Page<LeadListItem>>;
  abstract findStatus(id: string): Promise<LeadStatus | null>;
  abstract updateStatus(id: string, status: LeadStatus): Promise<LeadView>;
}
