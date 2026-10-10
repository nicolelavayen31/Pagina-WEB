import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { loginSchema, type EnvConfig } from '@repo/contracts';
import type { z } from 'zod';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import type { SessionUser } from '../../common/http/authenticated-request';
import { loginRateLimit, RATE_LIMIT_WINDOW_MS } from '../../common/http/rate-limits';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuditService } from '../audit/audit.service';
import { AuthService } from './auth.service';
import { SESSION_COOKIE } from './session.constants';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly audit: AuditService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  @Throttle({ default: { limit: loginRateLimit, ttl: RATE_LIMIT_WINDOW_MS } })
  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: z.infer<typeof loginSchema>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateCredentials(body.email, body.password);
    const session = await this.authService.createSession(user.id, req.headers['user-agent'] ?? null, req.ip ?? null);

    res.cookie(SESSION_COOKIE, session.token, { ...this.cookieOptions(), expires: session.expiresAt });
    await this.audit.log(user.id, 'auth.login', 'Session', session.sessionId);

    return { user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.revokeSession(req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
    return { success: true };
  }

  @UseGuards(SessionAuthGuard)
  @Get('me')
  me(@CurrentUser() user: SessionUser) {
    const { sessionId: _sessionId, ...publicUser } = user;
    return publicUser;
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      path: '/',
    };
  }
}
