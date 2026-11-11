import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { leadCreateSchema, leadListQuerySchema, leadStatusUpdateSchema, type LeadInput } from '@repo/contracts';
import type { z } from 'zod';
import { leadsRateLimit, RATE_LIMIT_WINDOW_MS } from '../../../common/presentation/rate-limits';
import { ZodValidationPipe } from '../../../common/presentation/zod-validation.pipe';
import type { SessionUser } from '../../auth/presentation/authenticated-request';
import { CurrentUser } from '../../auth/presentation/current-user.decorator';
import { RequirePermissions } from '../../auth/presentation/require-permissions.decorator';
import { ListLeadsUseCase } from '../application/use-cases/list-leads.use-case';
import { SubmitLeadUseCase } from '../application/use-cases/submit-lead.use-case';
import { UpdateLeadStatusUseCase } from '../application/use-cases/update-lead-status.use-case';

@Controller()
export class LeadsController {
  constructor(
    private readonly submitLead: SubmitLeadUseCase,
    private readonly listLeads: ListLeadsUseCase,
    private readonly updateLeadStatus: UpdateLeadStatusUseCase,
  ) {}

  @Throttle({ default: { limit: leadsRateLimit, ttl: RATE_LIMIT_WINDOW_MS } })
  @Post('leads')
  @HttpCode(201)
  create(@Body(new ZodValidationPipe(leadCreateSchema)) body: LeadInput, @Req() req: Request) {
    return this.submitLead.execute({ ...body, remoteIp: req.ip });
  }

  @RequirePermissions('lead:read')
  @Get('admin/leads')
  list(@Query(new ZodValidationPipe(leadListQuerySchema)) query: z.infer<typeof leadListQuerySchema>) {
    return this.listLeads.execute(query, query.status);
  }

  @RequirePermissions('lead:update_status')
  @Patch('admin/leads/:id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(leadStatusUpdateSchema)) body: z.infer<typeof leadStatusUpdateSchema>,
    @CurrentUser() user: SessionUser,
  ) {
    return this.updateLeadStatus.execute(id, body.status, user.id);
  }
}
