// apps/api/src/auth/auth.module.ts
import { Module, Global } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { ScopeGuard } from './scope.guard';
import { SessionService } from './session.service';
@Global()
@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])],
  controllers: [AuthController],
  providers: [AuthService, SessionService, AuthGuard, RolesGuard, ScopeGuard],
  exports: [AuthGuard, RolesGuard, ScopeGuard, SessionService],
})
export class AuthModule {}