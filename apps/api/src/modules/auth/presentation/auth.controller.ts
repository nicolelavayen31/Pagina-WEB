import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { loginSchema } from '@repo/contracts';
import type { EnvConfig } from '../../../config/env.schema';
import type { z } from 'zod';
import { loginRateLimit, RATE_LIMIT_WINDOW_MS } from '../../../common/presentation/rate-limits';
import { ZodValidationPipe } from '../../../common/presentation/zod-validation.pipe';
import { SessionService } from '../application/session.service';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import type { SessionUser } from './authenticated-request';
import { CurrentUser } from './current-user.decorator';
import { SessionAuthGuard } from './session-auth.guard';
import { SESSION_COOKIE } from './session-cookie';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly sessions: SessionService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  @Throttle({ default: { limit: loginRateLimit, ttl: RATE_LIMIT_WINDOW_MS } })
  @Post('login')
  @HttpCode(200)
  async signIn(
    @Body(new ZodValidationPipe(loginSchema)) body: z.infer<typeof loginSchema>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, session } = await this.login.execute({
      ...body,
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.ip ?? null,
    });
    res.cookie(SESSION_COOKIE, session.token, { ...this.cookieOptions(), expires: session.expiresAt });
    return { user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.sessions.revoke(req.cookies?.[SESSION_COOKIE]);
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
