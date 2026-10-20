// apps/api/src/imports/imports.service.ts
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, PeriodStatus, ReportStatus } from '@prisma/client';

export type ImportRow = {
  branchCode: string;
  thanaCode: string;
  reportTypeCode: string;
  sessionLabel: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  values: Array<{ fieldKey: string; valueNum?: number; valueText?: string }>;
};

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(user: any, rows: ImportRow[]) {
    this.assertSuper(user);
    if (!Array.isArray(rows)) throw new BadRequestException('rows must be an array');
    const errors: any[] = [];
    const accepted: number[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const branch = await this.prisma.branch.findUnique({ where: { code: r.branchCode } });
        const thana = await this.prisma.thana.findUnique({ where: { code: r.thanaCode } });
        const type = await this.prisma.reportType.findUnique({ where: { code: r.reportTypeCode as any } });
        const session = await this.prisma.academicSession.findUnique({ where: { label: r.sessionLabel } });
        if (!branch) throw new Error('branch not found');
        if (!thana) throw new Error('thana not found');
        if (thana.branchId !== branch.id) throw new Error('thana/branch mismatch');
        if (!type) throw new Error('report type not found');
        if (!session) throw new Error('session not found');
        if (!r.periodStart || !r.periodEnd) throw new Error('periodStart/periodEnd required');
        accepted.push(i);
      } catch (e: any) {
        errors.push({ index: i, reason: e.message });
      }
    }
    return { total: rows.length, acceptedCount: accepted.length, rejectedCount: errors.length, errors: errors.slice(0, 50) };
  }

  async dryRun(user: any, rows: ImportRow[]) {
    const v = await this.validate(user, rows);
    return { dryRun: true, ...v };
  }

  async commit(user: any, rows: ImportRow[], source = 'ui') {
    this.assertSuper(user);
    const results: any = { accepted: 0, rejected: 0, errors: [] as any[] };

    for (const r of rows) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const branch = await tx.branch.findUniqueOrThrow({ where: { code: r.branchCode } });
          const thana = await tx.thana.findUniqueOrThrow({ where: { code: r.thanaCode } });
          const type = await tx.reportType.findUniqueOrThrow({ where: { code: r.reportTypeCode as any } });
          const session = await tx.academicSession.findUniqueOrThrow({ where: { label: r.sessionLabel } });
          if (thana.branchId !== branch.id) throw new Error('thana/branch mismatch');

          const template = await tx.reportTemplate.findFirst({ where: { reportTypeId: type.id, isActive: true }, orderBy: { version: 'desc' } });
          if (!template) throw new Error('no active template');

          let period = await tx.reportingPeriod.findFirst({
            where: { branchId: branch.id, reportTypeId: type.id, label: r.periodLabel },
          });
          if (!period) {
            period = await tx.reportingPeriod.create({
              data: {
                branchId: branch.id,
                academicSessionId: session.id,
                reportTypeId: type.id,
                label: r.periodLabel,
                periodStart: new Date(r.periodStart),
                periodEnd: new Date(r.periodEnd),
                submissionDeadline: new Date(r.periodEnd),
                revisionDeadline: new Date(r.periodEnd),
                status: PeriodStatus.CLOSED,
              },
            });
          }

          const existing = await tx.report.findFirst({
            where: { thanaId: thana.id, reportTypeId: type.id, reportingPeriodId: period.id, status: ReportStatus.APPROVED },
          });
          if (existing) throw new Error('approved report already exists');

          const report = await tx.report.create({
            data: {
              thanaId: thana.id,
              reportTypeId: type.id,
              reportingPeriodId: period.id,
              templateId: template.id,
              version: 1,
              status: ReportStatus.APPROVED,
              approvedAt: new Date(),
              isApprovedSnapshot: true,
              thanaSnapshotName: thana.name,
              branchSnapshotName: branch.name,
            },
          });

          const fields = await tx.reportField.findMany({ where: { reportTemplateId: template.id } });
          const keyToId = new Map(fields.map((f) => [f.key, f.id]));
          for (const v of r.values ?? []) {
            const fieldId = keyToId.get(v.fieldKey);
            if (!fieldId) continue;
            await tx.reportValue.create({
              data: { reportId: report.id, fieldId, valueNum: v.valueNum ?? null, valueText: v.valueText ?? null },
            });
          }

          await tx.auditLog.create({
            data: { actorId: user.id, action: AuditAction.IMPORT, entity: 'Report', entityId: report.id, meta: { source } },
          });
        });
        results.accepted++;
      } catch (e: any) {
        results.rejected++;
        results.errors.push({ row: r, reason: e.message });
      }
    }
    return results;
  }

  private assertSuper(user: any) {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException();
  }
}