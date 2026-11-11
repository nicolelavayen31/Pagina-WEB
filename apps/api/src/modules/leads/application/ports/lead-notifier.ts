import type { BudgetRange } from '@repo/contracts';

export type NewLeadNotification = {
  name: string;
  company: string | null;
  email: string;
  phone: string;
  location: string;
  description: string;
  budgetRange: BudgetRange | null;
};

/**
 * Tells the team that a quote request arrived (e-mail today). Best effort: the request is already
 * stored when this runs, so a delivery failure must never turn into an error for the visitor.
 */
export abstract class LeadNotifier {
  abstract notifyNewLead(lead: NewLeadNotification): Promise<void>;
}
