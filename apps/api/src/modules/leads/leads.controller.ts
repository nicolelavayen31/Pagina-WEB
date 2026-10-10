import { Body, Controller, Get, HttpCode, Logger, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { leadCreateSchema, leadListQuerySchema, leadStatusUpdateSchema, type LeadInput } from '@repo/contracts';
import type { z } from 'zod';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type { SessionUser } from '../../common/http/authenticated-request';
import { leadsRateLimit, RATE_LIMIT_WINDOW_MS } from '../../common/http/rate-limits';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { LeadsService } from './leads.service';
import { TurnstileService } from './turnstile.service';

@Controller()
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(
    private readonly leadsService: LeadsService,
    private readonly turnstile: TurnstileService,
  ) {}

  @Throttle({ default: { limit: leadsRateLimit, ttl: RATE_LIMIT_WINDOW_MS } })
  @Post('leads')
  @HttpCode(201)
  async create(@Body(new ZodValidationPipe(leadCreateSchema)) body: LeadInput, @Req() req: Request) {
    if (body.website && body.website.trim() !== '') {
      // Honeypot hit: answer exactly like a success so bots get no signal, but store nothing.
      this.logger.warn(`Honeypot triggered from ${req.ip ?? 'unknown ip'}`);
      return { success: true };
    }

    await this.turnstile.verify(body.turnstileToken, req.ip);
    await this.leadsService.create(body);
    return { success: true };
  }

  @RequirePermissions('lead:read')
  @Get('admin/leads')
  list(@Query(new ZodValidationPipe(leadListQuerySchema)) query: z.infer<typeof leadListQuerySchema>) {
    return this.leadsService.list(query.page, query.pageSize, query.status);
  }

  @RequirePermissions('lead:update_status')
  @Patch('admin/leads/:id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(leadStatusUpdateSchema)) body: z.infer<typeof leadStatusUpdateSchema>,
    @CurrentUser() user: SessionUser,
  ) {
    return this.leadsService.updateStatus(id, body.status, user.id);
  }
}
