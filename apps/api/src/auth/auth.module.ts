// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
// ...existing imports
@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])],
  controllers: [AuthController],
  providers: [AuthService, SessionService, AuthGuard, RolesGuard, ScopeGuard],
  exports: [AuthGuard, RolesGuard, ScopeGuard, SessionService],
})
export class AuthModule {}