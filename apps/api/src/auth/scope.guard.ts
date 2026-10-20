// apps/api/src/auth/scope.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Ensures BRANCH_ADMIN/THANA_ADMIN can only touch own branch/thana.
 * Expects req.params.branchId or req.params.thanaId.
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException();
    if (user.role === 'SUPER_ADMIN') return true;

    if (user.role === 'BRANCH_ADMIN') {
      if (req.params.branchId && req.params.branchId !== user.branchId) throw new ForbiddenException();
      return true;
    }
    if (user.role === 'THANA_ADMIN') {
      if (req.params.thanaId && req.params.thanaId !== user.thanaId) throw new ForbiddenException();
      if (req.params.branchId && req.params.branchId !== user.branchId) throw new ForbiddenException();
      return true;
    }
    // VIEWER: read-only scope checked in service
    return true;
  }
}