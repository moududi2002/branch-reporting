// apps/api/src/auth/auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from './session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.['sid'];
    if (!token) throw new UnauthorizedException();
    const session = await this.sessions.verify(token);
    if (!session) throw new UnauthorizedException();
    req.user = session.user;
    return true;
  }
}