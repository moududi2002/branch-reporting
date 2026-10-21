// apps/api/src/auth/auth.controller.ts
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { generateCsrfToken } from '../common/csrf';
import { Throttle } from '@nestjs/throttler';



@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('csrf')
  csrf(@Req() req: Request, @Res() res: Response) {
    const token = generateCsrfToken(req, res);
    res.json({ csrfToken: token });
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Req() req: Request, @Res() res: Response) {
    const { token, user } = await this.auth.login(body.email, body.password, req.ip, req.headers['user-agent']);
    res.cookie('sid', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    res.json({ id: user.id, email: user.email, role: user.role, branchId: user.branchId, thanaId: user.thanaId });
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.['sid'];
    if (token) await this.auth.logout(token);
    res.clearCookie('sid');
    res.json({ ok: true });
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    const u: any = (req as any).user;
    return { id: u.id, email: u.email, role: u.role, branchId: u.branchId, thanaId: u.thanaId };
  }
}
