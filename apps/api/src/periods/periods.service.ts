// apps/api/src/periods/periods.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PeriodStatus, ReportStatus } from '@prisma/client';

@Injectable()
export class PeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  list(branchId?: string) {
    return this.prisma.reportingPeriod.findMany({
      where: branchId ? { branchId } : undefined,
      include: { reportType: true, academicSession: true },
      orderBy: { periodStart: 'desc' },
    });
  }

  /** Returns the period that contains "today" for a branch (running month). */
  async running(branchId: string, at = new Date()) {
    const p = await this.prisma.reportingPeriod.findFirst({
      where: {
        branchId,
        status: PeriodStatus.OPEN,
        periodStart: { lte: at },
        periodEnd: { gte: at },
      },
      include: { reportType: true, academicSession: true },
      orderBy: { periodStart: 'desc' },
    });
    return p ?? null;
  }

  async create(data: {
    branchId: string;
    academicSessionId: string;
    reportTypeId: string;
    label: string;
    periodStart: Date;
    periodEnd: Date;
    submissionDeadline: Date;
    revisionDeadline: Date;
    autoCloseOnDeadline?: boolean;
  }) {
    if (data.submissionDeadline < data.periodEnd)
      throw new BadRequestException('Submission deadline must be after period end');
    if (data.revisionDeadline < data.submissionDeadline)
      throw new BadRequestException('Revision deadline must be after submission deadline');

    const overlap = await this.prisma.reportingPeriod.findFirst({
      where: {
        branchId: data.branchId,
        reportTypeId: data.reportTypeId,
        status: PeriodStatus.OPEN,
        OR: [
          { periodStart: { lte: data.periodEnd }, periodEnd: { gte: data.periodStart } },
        ],
      },
    });
    if (overlap) throw new BadRequestException('Overlapping open period exists');

    const period = await this.prisma.reportingPeriod.create({ data });

    // Auto-create Draft for all thanas under branch (for all applicable report types)
    await this.autoCreateDrafts(period.id);

    return period;
  }

  async autoCreateDrafts(periodId: string) {
    const period = await this.prisma.reportingPeriod.findUniqueOrThrow({
      where: { id: periodId },
      include: { reportType: true },
    });

    // active template for this report type
    const template = await this.prisma.reportTemplate.findFirst({
      where: { reportTypeId: period.reportTypeId, isActive: true },
      orderBy: { version: 'desc' },
    });
    if (!template) return { created: 0, skipped: 0, reason: 'no active template' };

    const thanas = await this.prisma.thana.findMany({
      where: { branchId: period.branchId, isActive: true },
    });

    let created = 0;
    let skipped = 0;
    for (const t of thanas) {
      const exists = await this.prisma.report.findFirst({
        where: {
          thanaId: t.id,
          reportTypeId: period.reportTypeId,
          reportingPeriodId: period.id,
          version: 1,
        },
      });
      if (exists) {
        skipped++;
        continue;
      }

      // find previous approved report for sourceReportId
      const prev = await this.prisma.report.findFirst({
        where: {
          thanaId: t.id,
          reportTypeId: period.reportTypeId,
          status: ReportStatus.APPROVED,
          reportingPeriod: { periodEnd: { lt: period.periodStart } },
        },
        orderBy: { approvedAt: 'desc' },
      });

      const branch = await this.prisma.branch.findUnique({ where: { id: period.branchId } });

      await this.prisma.report.create({
        data: {
          thanaId: t.id,
          reportTypeId: period.reportTypeId,
          reportingPeriodId: period.id,
          templateId: template.id,
          version: 1,
          status: ReportStatus.DRAFT,
          sourceReportId: prev?.id ?? null,
          thanaSnapshotName: t.name,
          branchSnapshotName: branch?.name ?? null,
        },
      });
      created++;
    }
    return { created, skipped };
  }

  async extendDeadline(periodId: string, thanaId: string, dueAt: Date, reason: string) {
    return this.prisma.reportDeadline.create({
      data: { reportId: '', thanaId, dueAt, extensionReason: reason },
    });
  }

  async close(periodId: string) {
    const period = await this.prisma.reportingPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException();
    return this.prisma.reportingPeriod.update({
      where: { id: periodId },
      data: { status: PeriodStatus.CLOSED },
    });
  }


  async listReportsForPeriod(periodId: string, user: any) {
  const where: any = { reportingPeriodId: periodId };
  if (user.role === 'THANA_ADMIN') where.thanaId = user.thanaId;
  if (user.role === 'BRANCH_ADMIN' || user.role === 'VIEWER') {
    const thanas = await this.prisma.thana.findMany({ where: { branchId: user.branchId } });
    where.thanaId = { in: thanas.map((t) => t.id) };
  }
  return this.prisma.report.findMany({
    where,
    include: { thana: true, reportType: true },
    orderBy: { thanaId: 'asc' },
  });
  }

  async findOne(id: string) {
  return this.prisma.reportingPeriod.findUniqueOrThrow({
    where: { id },
    include: { reportType: true, academicSession: true, branch: true },
  });
  }
}