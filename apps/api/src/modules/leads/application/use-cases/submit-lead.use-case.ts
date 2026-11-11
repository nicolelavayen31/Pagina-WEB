import { Injectable, Logger } from '@nestjs/common';
import { PRIVACY_NOTICE_VERSION, type BudgetRange } from '@repo/contracts';
import { ServiceQueries } from '../../../services/application/service.queries';
import { isHoneypotTriggered } from '../../domain/lead';
import { UnknownServiceError } from '../../domain/lead.errors';
import { HumanVerifier } from '../ports/human-verifier';
import { LeadRepository } from '../ports/lead.repository';

export type SubmitLeadCommand = {
  name: string;
  company?: string;
  email: string;
  phone: string;
  serviceId?: string;
  location: string;
  description: string;
  budgetRange?: BudgetRange;
  website?: string;
  turnstileToken?: string;
  remoteIp?: string;
};

@Injectable()
export class SubmitLeadUseCase {
  private readonly logger = new Logger(SubmitLeadUseCase.name);

  constructor(
    private readonly leads: LeadRepository,
    private readonly humans: HumanVerifier,
    private readonly services: ServiceQueries,
  ) {}

  /** Answers the same way when the honeypot is hit, so bots get no signal; nothing is stored then. */
  async execute(command: SubmitLeadCommand): Promise<{ success: true }> {
    if (isHoneypotTriggered(command.website)) {
      this.logger.warn(`Honeypot triggered from ${command.remoteIp ?? 'unknown ip'}`);
      return { success: true };
    }

    await this.humans.verify(command.turnstileToken, command.remoteIp);

    if (command.serviceId && !(await this.services.isActive(command.serviceId))) {
      throw new UnknownServiceError();
    }

    // Fields are mapped one by one: nothing from the request reaches persistence unchecked.
    await this.leads.create({
      name: command.name,
      company: command.company || null,
      email: command.email.toLowerCase(),
      phone: command.phone,
      serviceId: command.serviceId ?? null,
      location: command.location,
      description: command.description,
      budgetRange: command.budgetRange ?? null,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      consentAt: new Date(),
    });
    return { success: true };
  }
}
