import { Global, Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard, PermissionsGuard],
  exports: [AuthService, SessionAuthGuard, PermissionsGuard],
})
export class AuthModule {}
