// apps/api/src/reports/form.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FormulaService } from '../compute/formula.service';

@Injectable()
export class FormService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly formula: FormulaService,
  ) {}

  async getForm(reportId: string, user: any) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        template: {
          include: {
            sections: true,
            fields: true,
          },
        },
        values: true,
        tableRows: true,
      },
    });

    if (!report) {
      throw new NotFoundException();
    }

    if (
      user.role === 'THANA_ADMIN' &&
      report.thanaId !== user.thanaId
    ) {
      throw new ForbiddenException();
    }

    if (user.role === 'BRANCH_ADMIN') {
      const thana = await this.prisma.thana.findUnique({
        where: { id: report.thanaId },
      });

      if (!thana || thana.branchId !== user.branchId) {
        throw new ForbiddenException();
      }
    }

    let previous: Record<string, any> = {};

    if (report.sourceReportId) {
      const src = await this.prisma.reportValue.findMany({
        where: { reportId: report.sourceReportId },
      });

      previous = Object.fromEntries(
        src.map((v) => [
          v.fieldId,
          v.valueNum ?? v.valueText,
        ]),
      );
    }

    const current = Object.fromEntries(
      report.values.map((v) => [
        v.fieldId,
        v.valueNum ?? v.valueText,
      ]),
    );

    const tableRows = report.tableRows.reduce(
      (acc: Record<string, any[]>, r) => {
        (acc[r.fieldId] ??= []).push({
          rowIndex: r.rowIndex,
          data: r.rowData,
        });

        return acc;
      },
      {},
    );

    // Active revision
    const activeRevisionRow =
      await this.prisma.reportRevision.findFirst({
        where: {
          reportId,
          resubmittedAt: null,
        },
        orderBy: {
          requestedAt: 'desc',
        },
      });

    const activeRevision = activeRevisionRow
      ? {
          id: activeRevisionRow.id,
          reason: activeRevisionRow.reason,
          targetFieldIds:
            (activeRevisionRow.targetFieldIds as string[] | null) ?? [],
          requestedAt: activeRevisionRow.requestedAt,
        }
      : null;

    // Revision deadline
    const revisionDeadline =
      await this.prisma.reportDeadline.findFirst({
        where: {
          reportId,
          extensionReason: 'revision',
        },
        orderBy: {
          dueAt: 'desc',
        },
      });

    // Computed formula values
    const computed =
      await this.formula.computeForReport(reportId);

    return {
      report: {
        id: report.id,
        thanaId: report.thanaId,
        reportTypeId: report.reportTypeId,
        reportingPeriodId: report.reportingPeriodId,
        status: report.status,
        version: report.version,
        thanaSnapshotName: report.thanaSnapshotName,
        branchSnapshotName: report.branchSnapshotName,
      },

      template: {
        id: report.template.id,
        version: report.template.version,
        sections: report.template.sections.sort(
          (a, b) => a.order - b.order,
        ),
        fields: report.template.fields.sort(
          (a, b) => a.order - b.order,
        ),
      },

      previous,
      current,
      computed,
      tableRows,
      activeRevision,

      revisionDeadline: revisionDeadline
        ? { dueAt: revisionDeadline.dueAt }
        : null,
    };
  }
}
