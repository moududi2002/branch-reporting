// apps/api/src/workflow/workflow.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, ReportStatus } from '@prisma/client';

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------- SUBMIT ----------------
  async submit(reportId: string, user: any, comment?: string) {
    const report = await this.load(reportId);
    this.assertThanaOwner(report, user);
    if (report.status !== ReportStatus.DRAFT && report.status !== ReportStatus.REVISION_REQUESTED)
      throw new BadRequestException('Only DRAFT/REVISION_REQUESTED can be submitted');

    const branch = await this.prisma.branch.findUniqueOrThrow({ where: { id: (await this.prisma.thana.findUniqueOrThrow({ where: { id: report.thanaId } })).branchId } });

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.SUBMITTED,
          submittedAt: new Date(),
          thanaSnapshotName: (await tx.thana.findUniqueOrThrow({ where: { id: report.thanaId } })).name,
          branchSnapshotName: branch.name,
        },
      });
      await tx.reportApproval.create({
        data: { reportId, action: 'SUBMIT', actorId: user.id, comment: comment ?? null },
      });
      await tx.auditLog.create({
        data: { actorId: user.id, action: AuditAction.SUBMIT, entity: 'Report', entityId: reportId },
      });
      return updated;
    });
  }

  // ---------------- APPROVE ----------------
  async approve(reportId: string, user: any, comment?: string) {
    const report = await this.load(reportId);
    await this.assertBranchScope(report, user);
    if (report.status !== ReportStatus.SUBMITTED)
      throw new BadRequestException('Only SUBMITTED can be approved');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.APPROVED,
          approvedAt: new Date(),
          isApprovedSnapshot: true,
        },
      });
      await tx.reportApproval.create({
        data: { reportId, action: 'APPROVE', actorId: user.id, comment: comment ?? null },
      });
      await tx.auditLog.create({
        data: { actorId: user.id, action: AuditAction.APPROVE, entity: 'Report', entityId: reportId },
      });
      return updated;
    });
  }

  // ---------------- REJECT ----------------
  async reject(reportId: string, user: any, comment: string) {
    if (!comment) throw new BadRequestException('Reject reason required');
    const report = await this.load(reportId);
    await this.assertBranchScope(report, user);
    if (report.status !== ReportStatus.SUBMITTED)
      throw new BadRequestException('Only SUBMITTED can be rejected');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.REJECTED },
      });
      await tx.reportApproval.create({
        data: { reportId, action: 'REJECT', actorId: user.id, comment },
      });
      await tx.auditLog.create({
        data: { actorId: user.id, action: AuditAction.REJECT, entity: 'Report', entityId: reportId },
      });
      return updated;
    });
  }

  // ---------------- REQUEST REVISION ----------------
  async requestRevision(reportId: string, user: any, body: {
    reason: string;
    targetFieldIds?: string[];
    revisionDeadline?: string;
  }) {
    if (!body?.reason) throw new BadRequestException('Reason required');
    const report = await this.load(reportId);
    await this.assertBranchScope(report, user);
    if (report.status !== ReportStatus.SUBMITTED)
      throw new BadRequestException('Only SUBMITTED can be sent for revision');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.REVISION_REQUESTED },
      });

      // snapshot current values for comparison
      const currentValues = await tx.reportValue.findMany({ where: { reportId } });
      const currentMap = Object.fromEntries(currentValues.map((v) => [v.fieldId, v.valueNum ?? v.valueText]));

      await tx.reportRevision.create({
        data: {
          reportId,
          requestedById: user.id,
          reason: body.reason,
          targetFieldIds: body.targetFieldIds ?? null,
          previousValues: currentMap as any,
        },
      });
      await tx.reportApproval.create({
        data: { reportId, action: 'REQUEST_REVISION', actorId: user.id, comment: body.reason },
      });
      await tx.auditLog.create({
        data: { actorId: user.id, action: AuditAction.REQUEST_REVISION, entity: 'Report', entityId: reportId },
      });

      if (body.revisionDeadline) {
        await tx.reportDeadline.create({
          data: {
            reportId,
            thanaId: report.thanaId,
            dueAt: new Date(body.revisionDeadline),
            extensionReason: 'revision',
          },
        });
      }
      return updated;
    });
  }

  // ---------------- RESUBMIT ----------------
  async resubmit(reportId: string, user: any, comment?: string) {
    const report = await this.load(reportId);
    this.assertThanaOwner(report, user);
    if (report.status !== ReportStatus.REVISION_REQUESTED)
      throw new BadRequestException('Only REVISION_REQUESTED can be resubmitted');

    return this.prisma.$transaction(async (tx) => {
      const latestRevision = await tx.reportRevision.findFirst({
        where: { reportId, resubmittedAt: null },
        orderBy: { requestedAt: 'desc' },
      });

      const currentValues = await tx.reportValue.findMany({ where: { reportId } });
      const newMap = Object.fromEntries(currentValues.map((v) => [v.fieldId, v.valueNum ?? v.valueText]));

      if (latestRevision) {
        await tx.reportRevision.update({
          where: { id: latestRevision.id },
          data: { resubmittedAt: new Date(), newValues: newMap as any },
        });
      }

      const updated = await tx.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.SUBMITTED, submittedAt: new Date() },
      });
      await tx.reportApproval.create({
        data: { reportId, action: 'RESUBMIT', actorId: user.id, comment: comment ?? null },
      });
      await tx.auditLog.create({
        data: { actorId: user.id, action: AuditAction.SUBMIT, entity: 'Report', entityId: reportId, meta: { resubmit: true } },
      });
      return updated;
    });
  }

  // ---------------- NEW WORKING VERSION ----------------
  /**
   * Create a new working version of an already-approved report.
   * The approved report remains untouched (snapshot); new version starts as DRAFT.
   * Previous values are copied so the thana can modify only what changes.
   */
  async createNewVersion(reportId: string, user: any) {
    const report = await this.load(reportId);
    await this.assertBranchScope(report, user);
    if (report.status !== ReportStatus.APPROVED)
      throw new BadRequestException('Only APPROVED reports can spawn a new version');

    const latest = await this.prisma.report.findFirst({
      where: { thanaId: report.thanaId, reportTypeId: report.reportTypeId, reportingPeriodId: report.reportingPeriodId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latest?.version ?? report.version) + 1;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: {
          thanaId: report.thanaId,
          reportTypeId: report.reportTypeId,
          reportingPeriodId: report.reportingPeriodId,
          templateId: report.templateId,
          version: nextVersion,
          status: ReportStatus.DRAFT,
          sourceReportId: report.id,
          thanaSnapshotName: report.thanaSnapshotName,
          branchSnapshotName: report.branchSnapshotName,
        },
      });

      const srcValues = await tx.reportValue.findMany({ where: { reportId: report.id } });
      if (srcValues.length) {
        await tx.reportValue.createMany({
          data: srcValues.map((v) => ({
            reportId: created.id,
            fieldId: v.fieldId,
            valueNum: v.valueNum,
            valueText: v.valueText,
          })),
        });
      }
      await tx.auditLog.create({
        data: { actorId: user.id, action: AuditAction.CREATE, entity: 'Report', entityId: created.id, meta: { spawnedFrom: report.id } },
      });
      return created;
    });
  }

  // ---------------- HISTORY ----------------
  async history(reportId: string) {
    const [approvals, revisions] = await Promise.all([
      this.prisma.reportApproval.findMany({ where: { reportId }, orderBy: { actedAt: 'asc' } }),
      this.prisma.reportRevision.findMany({ where: { reportId }, orderBy: { requestedAt: 'asc' } }),
    ]);
    return { approvals, revisions };
  }

  // ---------------- HELPERS ----------------
  private load(id: string) {
    return this.prisma.report.findUniqueOrThrow({ where: { id } }).catch(() => {
      throw new NotFoundException();
    });
  }

  private assertThanaOwner(report: { thanaId: string }, user: any) {
    if (user.role === 'THANA_ADMIN' && report.thanaId !== user.thanaId) throw new ForbiddenException();
    if (user.role === 'BRANCH_ADMIN' || user.role === 'VIEWER') throw new ForbiddenException('Only thana user can submit');
  }

  private async assertBranchScope(report: { thanaId: string }, user: any) {
    if (user.role === 'SUPER_ADMIN') return;
    if (user.role !== 'BRANCH_ADMIN') throw new ForbiddenException('Branch admin only');
    const thana = await this.prisma.thana.findUniqueOrThrow({ where: { id: report.thanaId } });
    if (thana.branchId !== user.branchId) throw new ForbiddenException();
  }
}