import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { LeadsService } from './leads.service';
import { leadCreateSchema } from '@repo/contracts';
import { LeadStatus } from '@prisma/client';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post()
  create(@Body() body: unknown) {
    const parsed = leadCreateSchema.parse(body);
    if (parsed.website) {
      throw new Error('Suspicious request');
    }
    return this.leadsService.create(parsed);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROJECT_MANAGER')
  @Get()
  listAdmin() {
    return this.leadsService.listAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: LeadStatus) {
    return this.leadsService.updateStatus(id, status);
  }
}
