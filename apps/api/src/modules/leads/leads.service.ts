import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  listAdmin() {
    return this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  create(payload: any) {
    return this.prisma.lead.create({
      data: {
        ...payload,
        status: payload.status || LeadStatus.NEW,
      },
    });
  }

  async updateStatus(id: string, status: LeadStatus) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.prisma.lead.update({
      where: { id },
      data: { status },
    });
  }
}
