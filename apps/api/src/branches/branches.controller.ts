// apps/api/src/branches/branches.controller.ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'VIEWER')
  @Get()
  list() {
    return this.branches.list();
  }

  @Roles('SUPER_ADMIN')
  @Post()
  create(@Body() body: { name: string; code: string }) {
    return this.branches.create(body);
  }

  @Roles('SUPER_ADMIN')
  @Post(':id/rename')
  rename(@Param('id') id: string, @Body() body: { name: string }) {
    return this.branches.rename(id, body.name);
  }
}