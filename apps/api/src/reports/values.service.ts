// apps/api/src/reports/values.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';

/**
 * Value-level upsert for report_values and report_table_rows.
 * Auto-loads read-only "previous" values from sourceReportId on first access.
 */
@Injectable()
export class ValuesService {
  constructor(private readonly prisma: PrismaService) {}

async upsertValues(reportId: string, user: any, values: any[], expectedVersion?: number) {
  const report = await this.prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new NotFoundException();
  this.assertEditable(report, user);
  if (expectedVersion != null && expectedVersion !== report.version) throw new BadRequestException('Version mismatch');
  await this.prisma.$transaction([
    this.prisma.report.update({ where: { id: reportId }, data: { version: { increment: 1 } } }),
    ...values.map((v) => this.prisma.reportValue.upsert({ /* ... */ })),
  ]);
  return { ok: true };
}

  private assertEditable(report: { thanaId: string; status: ReportStatus }, user: any) {
    if (report.status === ReportStatus.APPROVED) throw new ForbiddenException('Approved report is read-only');
    if (user.role === 'THANA_ADMIN' && report.thanaId !== user.thanaId) throw new ForbiddenException();
    if (user.role === 'BRANCH_ADMIN') throw new ForbiddenException('Branch admin cannot edit thana values');
    if (user.role === 'VIEWER') throw new ForbiddenException();
  }

  async upsertTableRows(reportId, user, fieldId, rows, expectedVersion?) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException();
    this.assertEditable(report, user);
    if (expectedVersion != null && expectedVersion !== report.version) throw new BadRequestException('Version mismatch');
    await this.prisma.$transaction([
      this.prisma.report.update({ where: { id: reportId }, data: { version: { increment: 1 } } }),
      this.prisma.reportTableRow.deleteMany({ where: { reportId, fieldId } }),
      ...rows.map((r) => this.prisma.reportTableRow.create({ data: { reportId, fieldId, rowIndex: r.rowIndex, rowData: r.rowData } })),
    ]);
    return { ok: true };
  }

}