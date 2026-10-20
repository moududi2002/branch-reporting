// apps/api/src/audit/audit.controller.ts

import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';

import { AuditService } from './audit.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @Query(
      'limit',
      new DefaultValuePipe(100),
      ParseIntPipe,
    )
    limit: number,
  ) {
    return this.auditService.findAll(limit);
  }
}
