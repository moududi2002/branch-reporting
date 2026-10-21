// apps/api/src/aggregation/dashboard.controller.ts
import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ReportStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

@UseGuards(AuthGuard, RolesGuard)
@Controller('branches/:branchId/dashboard')
export class DashboardController {
constructor(private readonly prisma: PrismaService) {}

@Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'VIEWER')
@Get('summary')
async summary(@Param('branchId') branchId: string, @Query('periodId') periodId: string) {
  if (!periodId) throw new BadRequestException('periodId required');
  const thanas = await this.prisma.thana.findMany({ where: { branchId, isActive: true } });
  const thanaIds = thanas.map((t) => t.id);
  const reports = await this.prisma.report.findMany({ where: { reportingPeriodId: periodId, thanaId: { in: thanaIds } } });

  const byStatus: Record<string, number> = {};
  const submittedThanas = new Set<string>();
  const pendingList: any[] = [];
  const revisionList: any[] = [];
  for (const r of reports) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    if (r.status !== 'DRAFT') submittedThanas.add(r.thanaId);
    if (r.status === 'SUBMITTED') pendingList.push({ id: r.id, thanaId: r.thanaId, thanaName: thanas.find((t) => t.id === r.thanaId)?.name });
    if (r.status === 'REVISION_REQUESTED') revisionList.push({ id: r.id, thanaId: r.thanaId, thanaName: thanas.find((t) => t.id === r.thanaId)?.name });
  }
  const missing = thanas.filter((t) => !submittedThanas.has(t.id)).map((t) => ({ id: t.id, name: t.name }));

  const period = await this.prisma.reportingPeriod.findUnique({ where: { id: periodId } });
  const daysToDeadline = period ? Math.ceil((period.submissionDeadline.getTime() - Date.now()) / 86400000) : null;

  return {
    totalThanas: thanas.length,
    approved: byStatus['APPROVED'] ?? 0,
    submitted: byStatus['SUBMITTED'] ?? 0,
    revisionRequested: byStatus['REVISION_REQUESTED'] ?? 0,
    rejected: byStatus['REJECTED'] ?? 0,
    draft: byStatus['DRAFT'] ?? 0,
    missing, pendingList, revisionList,
    daysToDeadline,
    submissionDeadline: period?.submissionDeadline,
  };
}
}