// apps/api/src/reports/values.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';

type ReportValueInput = {
  fieldId: string;
  valueText?: string | null;
  valueNum?: number | null;
};

type ReportTableRowInput = {
  rowIndex: number;
  rowData: any;
};

/**
 * Handles report values and table rows.
 * Supports optimistic version checking.
 */
@Injectable()
export class ValuesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertValues(
    reportId: string,
    user: any,
    values: ReportValueInput[],
    expectedVersion?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      this.assertEditable(report, user);

      if (
        expectedVersion != null &&
        expectedVersion !== report.version
      ) {
        throw new BadRequestException('Version mismatch');
      }

      // Validate field IDs against this report's template.
      const fieldIds = [...new Set(values.map((v) => v.fieldId))];

      const validFields = await tx.reportField.findMany({
        where: {
          id: { in: fieldIds },
          reportTemplateId: report.templateId,
        },
        select: { id: true },
      });

      if (validFields.length !== fieldIds.length) {
        throw new BadRequestException(
          'One or more fields do not belong to this report template',
        );
      }

      // Prevent writes to read-only fields.
      const readOnlyFields = await tx.reportField.findMany({
        where: {
          id: { in: fieldIds },
          isReadOnly: true,
        },
        select: { id: true },
      });

      if (readOnlyFields.length > 0) {
        throw new ForbiddenException(
          'Cannot update read-only fields',
        );
      }

      // Increment the version only when the expected version matches.
      if (expectedVersion != null) {
        const updated = await tx.report.updateMany({
          where: {
            id: reportId,
            version: expectedVersion,
          },
          data: {
            version: { increment: 1 },
          },
        });

        if (updated.count !== 1) {
          throw new BadRequestException('Version mismatch');
        }
      } else {
        await tx.report.update({
          where: { id: reportId },
          data: {
            version: { increment: 1 },
          },
        });
      }

      for (const value of values) {
        await tx.reportValue.upsert({
          where: {
            reportId_fieldId: {
              reportId,
              fieldId: value.fieldId,
            },
          },
          update: {
            valueText: value.valueText ?? null,
            valueNum: value.valueNum ?? null,
          },
          create: {
            reportId,
            fieldId: value.fieldId,
            valueText: value.valueText ?? null,
            valueNum: value.valueNum ?? null,
          },
        });
      }

      return {
        ok: true,
        count: values.length,
        version:
          expectedVersion != null
            ? expectedVersion + 1
            : report.version + 1,
      };
    });
  }

  async upsertTableRows(
    reportId: string,
    user: any,
    fieldId: string,
    rows: ReportTableRowInput[],
    expectedVersion?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      this.assertEditable(report, user);

      if (
        expectedVersion != null &&
        expectedVersion !== report.version
      ) {
        throw new BadRequestException('Version mismatch');
      }

      const field = await tx.reportField.findFirst({
        where: {
          id: fieldId,
          reportTemplateId: report.templateId,
        },
      });

      if (!field) {
        throw new BadRequestException(
          'Field does not belong to this report template',
        );
      }

      if (field.isReadOnly || field.fieldType !== 'TABLE_ROWS') {
        throw new ForbiddenException(
          'Field is read-only or is not a table field',
        );
      }

      if (expectedVersion != null) {
        const updated = await tx.report.updateMany({
          where: {
            id: reportId,
            version: expectedVersion,
          },
          data: {
            version: { increment: 1 },
          },
        });

        if (updated.count !== 1) {
          throw new BadRequestException('Version mismatch');
        }
      } else {
        await tx.report.update({
          where: { id: reportId },
          data: {
            version: { increment: 1 },
          },
        });
      }

      await tx.reportTableRow.deleteMany({
        where: { reportId, fieldId },
      });

      if (rows.length > 0) {
        await tx.reportTableRow.createMany({
          data: rows.map((row) => ({
            reportId,
            fieldId,
            rowIndex: row.rowIndex,
            rowData: row.rowData,
          })),
        });
      }

      return {
        ok: true,
        count: rows.length,
        version: report.version + 1,
      };
    });
  }

  private assertEditable(
    report: {
      thanaId: string;
      status: ReportStatus;
    },
    user: any,
  ): void {
    if (report.status === ReportStatus.APPROVED) {
      throw new ForbiddenException(
        'Approved report is read-only',
      );
    }

    if (user.role === 'THANA_ADMIN') {
      if (report.thanaId !== user.thanaId) {
        throw new ForbiddenException(
          'You cannot edit another thana report',
        );
      }
      return;
    }

    if (
      user.role === 'BRANCH_ADMIN' ||
      user.role === 'VIEWER'
    ) {
      throw new ForbiddenException(
        'You do not have permission to edit report values',
      );
    }

    if (
      user.role !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException(
        'You do not have permission to edit report values',
      );
    }
  }
}
