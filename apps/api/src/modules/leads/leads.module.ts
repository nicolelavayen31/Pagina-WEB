import { Module } from '@nestjs/common';
import { ServicesModule } from '../services/services.module';
import { HumanVerifier } from './application/ports/human-verifier';
import { LeadNotifier } from './application/ports/lead-notifier';
import { LeadRepository } from './application/ports/lead.repository';
import { ListLeadsUseCase } from './application/use-cases/list-leads.use-case';
import { SubmitLeadUseCase } from './application/use-cases/submit-lead.use-case';
import { UpdateLeadStatusUseCase } from './application/use-cases/update-lead-status.use-case';
import { PrismaLeadRepository } from './infrastructure/prisma-lead.repository';
import { ResendLeadNotifier } from './infrastructure/resend-lead-notifier';
import { TurnstileHumanVerifier } from './infrastructure/turnstile-human-verifier';
import { LeadsController } from './presentation/leads.controller';

@Module({
  imports: [ServicesModule],
  controllers: [LeadsController],
  providers: [
    { provide: LeadRepository, useClass: PrismaLeadRepository },
    { provide: HumanVerifier, useClass: TurnstileHumanVerifier },
    { provide: LeadNotifier, useClass: ResendLeadNotifier },
    SubmitLeadUseCase,
    ListLeadsUseCase,
    UpdateLeadStatusUseCase,
  ],
})
export class LeadsModule {}
