// apps/api/src/aggregation/aggregation.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus, PeriodStatus } from '@prisma/client';
import { aggregateField, FieldDef, ThanaValues } from './rules';

export type AggregateScope = 'monthly' | 'semi-annual' | 'annual';

@Injectable()
export class AggregationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Branch-level aggregate for a report type within a time window.
   * Includes only APPROVED reports; lists missing / pending / not-approved thanas.
   */
  async branchAggregate(params: {
    branchId: string;
    reportTypeId: string;
    from: Date;
    to: Date;
    scope: AggregateScope;
    user: any;
  }) {
    const { branchId, reportTypeId, from, to, scope, user } = params;
    await this.assertBranchScope(branchId, user);

    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundException('Branch not found');

    const type = await this.prisma.reportType.findUnique({ where: { id: reportTypeId } });
    if (!type) throw new NotFoundException('Report type not found');

    const template = await this.prisma.reportTemplate.findFirst({
      where: { reportTypeId, isActive: true },
      orderBy: { version: 'desc' },
      include: { fields: true },
    });
    if (!template) throw new NotFoundException('No active template');

    const thanas = await this.prisma.thana.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: 'asc' },
    });

    const periods = await this.prisma.reportingPeriod.findMany({
      where: {
        branchId,
        reportTypeId,
        periodStart: { gte: from },
        periodEnd: { lte: to },
      },
      orderBy: { periodStart: 'asc' },
    });
    const periodIds = periods.map((p) => p.id);

    // Fetch all reports in scope
    const reports = await this.prisma.report.findMany({
      where: {
        reportTypeId,
        reportingPeriodId: { in: periodIds },
      },
      include: { values: true, thana: true, reportingPeriod: true },
    });

    // Build per-thana status and values
    const thanaValuesList: ThanaValues[] = [];
    const pendingList: { thanaId: string; thanaName: string; periodLabel: string; status: string }[] = [];
    const missingList: { thanaId: string; thanaName: string; periodLabel: string; status: string }[] = [];

    for (const t of thanas) {
      // gather reports for this thana within window
      const tReports = reports.filter((r) => r.thanaId === t.id);
      if (!tReports.length) {
        missingList.push({ thanaId: t.id, thanaName: t.name, periodLabel: '', status: 'MISSING' });
        thanaValuesList.push({ thanaId: t.id, thanaName: t.name, status: 'MISSING', values: {} });
        continue;
      }

      // For semi-annual/annual, prefer the latest APPROVED snapshot at end of window.
      // For monthly, aggregate the period's APPROVED report.
      const approved = tReports.filter((r) => r.status === ReportStatus.APPROVED);
      if (!approved.length) {
        pendingList.push({
          thanaId: t.id,
          thanaName: t.name,
          periodLabel: tReports[0].reportingPeriod.label,
          status: tReports[0].status,
        });
        thanaValuesList.push({ thanaId: t.id, thanaName: t.name, status: 'PENDING', values: {} });
        continue;
      }

      // Choose the approved report: monthly -> first; semi/annual -> latest approved
      const pick = scope === 'monthly'
        ? approved[0]
        : approved.sort((a, b) => b.approvedAt!.getTime() - a.approvedAt!.getTime())[0];

      const values: Record<string, { num: number | null; text: string | null }> = {};
      for (const v of pick.values) {
        values[v.fieldId] = { num: v.valueNum ? Number(v.valueNum) : null, text: v.valueText ?? null };
      }
      thanaValuesList.push({ thanaId: t.id, thanaName: t.name, status: 'APPROVED', values });
    }

    // Aggregate per field
    const fieldDefs: FieldDef[] = template.fields.map((f) => ({
      id: f.id,
      key: f.key,
      labelBn: f.labelBn,
      aggregationRule: f.aggregationRule,
      fieldType: f.fieldType,
    }));

    const aggregated = fieldDefs.map((f) => {
      const r = aggregateField(f, thanaValuesList);
      return {
        fieldId: f.id,
        key: f.key,
        labelBn: f.labelBn,
        aggregationRule: f.aggregationRule,
        valueNum: r.num,
        valueText: r.text,
        excludedThanas: r.excludedThanas,
      };
    });

    return {
      branch: { id: branch.id, name: branch.name },
      reportType: { id: type.id, code: type.code, nameBn: type.nameBn },
      scope,
      window: { from, to },
      periods: periods.map((p) => ({ id: p.id, label: p.label, periodStart: p.periodStart, periodEnd: p.periodEnd, status: p.status })),
      aggregated,
      missing: missingList,
      pending: pendingList,
      thanaCount: thanas.length,
      approvedCount: thanaValuesList.filter((t) => t.status === 'APPROVED').length,
      missingCount: missingList.length,
      pendingCount: pendingList.length,
    };
  }

  /**
   * Helper: derive semi-annual window (6 months ending at `at`) or annual (12 months).
   * December–December interpretation kept explicit via `inclusiveEnd` flag.
   */
  windowFor(scope: AggregateScope, at: Date, inclusiveEnd = false) {
    const end = new Date(at);
    let from: Date;
    if (scope === 'monthly') {
      from = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (scope === 'semi-annual') {
      from = new Date(end.getFullYear(), end.getMonth() - 5, 1);
    } else {
      from = new Date(end.getFullYear(), end.getMonth() - 11, 1);
    }
    const to = inclusiveEnd
      ? new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59)
      : new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59);
    return { from, to };
  }

  private async assertBranchScope(branchId: string, user: any) {
    if (user.role === 'SUPER_ADMIN') return;
    if (user.role === 'BRANCH_ADMIN') {
      if (user.branchId !== branchId) throw new ForbiddenException();
      return;
    }
    if (user.role === 'VIEWER') {
      if (user.branchId !== branchId) throw new ForbiddenException();
      return;
    }
    throw new ForbiddenException('Not allowed');
  }
}