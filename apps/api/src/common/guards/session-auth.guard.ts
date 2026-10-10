import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { SESSION_COOKIE } from '../../modules/auth/session.constants';
import type { AuthenticatedRequest } from '../http/authenticated-request';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.authService.resolveSession(request.cookies?.[SESSION_COOKIE]);
    if (!user) {
      throw new UnauthorizedException('Sesión no válida o expirada');
    }
    request.user = user;
    return true;
  }
}
