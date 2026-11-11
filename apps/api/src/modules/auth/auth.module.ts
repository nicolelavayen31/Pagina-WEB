import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../config/env.schema';
import { PasswordHasher } from './application/ports/password-hasher';
import { SessionRepository } from './application/ports/session.repository';
import { UserAccountRepository } from './application/ports/user-account.repository';
import { SessionPolicy, SessionService } from './application/session.service';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { PrismaSessionRepository } from './infrastructure/prisma-session.repository';
import { PrismaUserAccountRepository } from './infrastructure/prisma-user-account.repository';
import { AuthController } from './presentation/auth.controller';
import { PermissionsGuard } from './presentation/permissions.guard';
import { SessionAuthGuard } from './presentation/session-auth.guard';

/**
 * Global so that `@RequirePermissions()` works in every module without re-importing the guards.
 * Also publishes `SessionService` and `PasswordHasher` for the users and media modules.
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [
    { provide: SessionRepository, useClass: PrismaSessionRepository },
    { provide: UserAccountRepository, useClass: PrismaUserAccountRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    {
      provide: SessionPolicy,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>): SessionPolicy => ({
        ttlMs: config.get('SESSION_TTL_MS', { infer: true }),
      }),
    },
    SessionService,
    LoginUseCase,
    SessionAuthGuard,
    PermissionsGuard,
  ],
  exports: [SessionService, PasswordHasher, SessionAuthGuard, PermissionsGuard],
})
export class AuthModule {}
