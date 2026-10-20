// apps/api/src/thanas/thanas.controller.ts
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ThanasService } from './thanas.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ScopeGuard } from '../auth/scope.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard, ScopeGuard)
@Controller()
export class ThanasController {
  constructor(private readonly thanas: ThanasService) {}

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'VIEWER')
  @Get('branches/:branchId/thanas')
  list(@Param('branchId') branchId: string) {
    return this.thanas.listByBranch(branchId);
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN')
  @Post('branches/:branchId/thanas')
  create(@Param('branchId') branchId: string, @Body() body: { name: string; code: string }) {
    return this.thanas.create({ branchId, ...body });
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN')
  @Post('thanas/:thanaId/rename')
  rename(@Param('thanaId') thanaId: string, @Body() body: { name: string }) {
    return this.thanas.rename(thanaId, body.name);
  }
}