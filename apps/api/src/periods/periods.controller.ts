// apps/api/src/periods/periods.controller.ts
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PeriodsService } from './periods.service';
import { SessionsService } from './sessions.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ScopeGuard } from '../auth/scope.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard, ScopeGuard)
@Controller()
export class PeriodsController {
  constructor(
    private readonly periods: PeriodsService,
    private readonly sessions: SessionsService,
  ) {}

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'THANA_ADMIN', 'VIEWER')
  @Get('reporting-periods/:periodId/reports')
  async reports(@Param('periodId') periodId: string, @Req() req: any) {
    // delegate to service method below
    return this.periods.listReportsForPeriod(periodId, req.user);
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'THANA_ADMIN', 'VIEWER')
  @Get('reporting-periods/:id')
  findOne(@Param('id') id: string) {
    return this.periods.findOne(id);
  }

  // ----- Academic Sessions -----
  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'THANA_ADMIN', 'VIEWER')
  @Get('academic-sessions')
  listSessions() {
    return this.sessions.list();
  }

  @Roles('SUPER_ADMIN')
  @Post('academic-sessions')
  createSession(@Body() body: { label: string; startDate: string; endDate: string }) {
    return this.sessions.create({
      label: body.label,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  // ----- Reporting Periods -----
  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'THANA_ADMIN', 'VIEWER')
  @Get('reporting-periods')
  list(@Query('branchId') branchId?: string) {
    return this.periods.list(branchId);
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'THANA_ADMIN', 'VIEWER')
  @Get('branches/:branchId/reporting-periods/running')
  running(@Param('branchId') branchId: string) {
    return this.periods.running(branchId);
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN')
  @Post('branches/:branchId/reporting-periods')
  create(@Param('branchId') branchId: string, @Body() body: any) {
    return this.periods.create({
      branchId,
      academicSessionId: body.academicSessionId,
      reportTypeId: body.reportTypeId,
      label: body.label,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      submissionDeadline: new Date(body.submissionDeadline),
      revisionDeadline: new Date(body.revisionDeadline),
      autoCloseOnDeadline: body.autoCloseOnDeadline ?? true,
    });
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN')
  @Post('reporting-periods/:id/auto-create-drafts')
  autoDrafts(@Param('id') id: string) {
    return this.periods.autoCreateDrafts(id);
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN')
  @Post('reporting-periods/:id/close')
  close(@Param('id') id: string) {
    return this.periods.close(id);
  }
}