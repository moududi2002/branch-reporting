// apps/api/src/users/users.controller.ts
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(AuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN')
  @Get()
  list(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.users.list(req.user, branchId);
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN')
  @Post()
  create(@Req() req: any, @Body() body: {
    email: string; password: string; fullName: string; role: Role;
    branchId?: string; thanaId?: string;
  }) {
    return this.users.create(req.user, body);
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN')
  @Post(':id/deactivate')
  deactivate(@Req() req: any, @Param('id') id: string) {
    return this.users.deactivate(req.user, id);
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN')
  @Post(':id/reset-password')
  reset(@Req() req: any, @Param('id') id: string, @Body() body: { newPassword: string }) {
    return this.users.resetPassword(req.user, id, body.newPassword);
  }
}