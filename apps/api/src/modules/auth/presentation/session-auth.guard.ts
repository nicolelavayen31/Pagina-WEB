import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../application/session.service';
import type { AuthenticatedRequest } from './authenticated-request';
import { SESSION_COOKIE } from './session-cookie';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.sessions.resolve(request.cookies?.[SESSION_COOKIE]);
    if (!user) {
      throw new UnauthorizedException('Sesión no válida o expirada');
    }
    request.user = user;
    return true;
  }
}
