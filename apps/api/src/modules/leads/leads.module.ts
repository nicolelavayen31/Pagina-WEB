import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { TurnstileService } from './turnstile.service';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, TurnstileService],
})
export class LeadsModule {}
