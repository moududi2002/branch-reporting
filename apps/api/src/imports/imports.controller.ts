// apps/api/src/imports/imports.controller.ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('imports')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Roles('SUPER_ADMIN')
  @Post('historical/validate')
  validate(@Req() req: any, @Body() body: { rows: any[] }) {
    return this.imports.validate(req.user, body.rows);
  }

  @Roles('SUPER_ADMIN')
  @Post('historical/dry-run')
  dryRun(@Req() req: any, @Body() body: { rows: any[] }) {
    return this.imports.dryRun(req.user, body.rows);
  }

  @Roles('SUPER_ADMIN')
  @Post('historical/commit')
  commit(@Req() req: any, @Body() body: { rows: any[]; source?: string }) {
    return this.imports.commit(req.user, body.rows, body.source ?? 'ui');
  }
}