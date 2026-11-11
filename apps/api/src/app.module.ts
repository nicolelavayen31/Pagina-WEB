import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/persistence/prisma.module';
import { StorageModule } from './common/storage/storage.module';
import { validateEnv } from './config/validate-env';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { LeadsModule } from './modules/leads/leads.module';
import { MediaModule } from './modules/media/media.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ServicesModule } from './modules/services/services.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
    }),
    PrismaModule,
    StorageModule,
    AuditModule,
    AuthModule,
    HealthModule,
    ServicesModule,
    ProjectsModule,
    MediaModule,
    LeadsModule,
    UsersModule,
    DashboardModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
