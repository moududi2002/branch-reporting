// apps/api/scripts/import-historical-data.ts
/**
 * Usage:
 *   pnpm --filter @repo/api ts-node scripts/import-historical-data.ts <jsonFile> [--dry-run]
 *
 * Expected JSON shape:
 * [
 *   {
 *     "branchCode": "PRIME",
 *     "thanaCode": "T001",
 *     "reportTypeCode": "MONTHLY",
 *     "sessionLabel": "২০২৪",
 *     "periodLabel": "মার্চ ২০২৪",
 *     "periodStart": "2024-03-01T00:00:00.000Z",
 *     "periodEnd": "2024-03-31T23:59:59.000Z",
 *     "values": [{ "fieldKey": "jonshoshi.সদস্য.current", "valueNum": 100 }]
 *   }
 * ]
 */
import { PrismaClient, ReportStatus, PeriodStatus } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const file = process.argv[2];
  const dryRun = process.argv.includes('--dry-run');
  if (!file) throw new Error('JSON file required');
  const rows: any[] = JSON.parse(fs.readFileSync(file, 'utf8'));

  let accepted = 0, rejected = 0;
  const errors: any[] = [];

  for (const r of rows) {
    try {
      const branch = await prisma.branch.findUnique({ where: { code: r.branchCode } });
      const thana = await prisma.thana.findUnique({ where: { code: r.thanaCode } });
      const type = await prisma.reportType.findUnique({ where: { code: r.reportTypeCode } });
      const session = await prisma.academicSession.findUnique({ where: { label: r.sessionLabel } });
      if (!branch || !thana || !type || !session) {
        rejected++;
        errors.push({ r, reason: 'missing branch/thana/type/session' });
        continue;
      }
      if (thana.branchId !== branch.id) {
        rejected++;
        errors.push({ r, reason: 'thana not in branch' });
        continue;
      }

      const template = await prisma.reportTemplate.findFirst({
        where: { reportTypeId: type.id, isActive: true },
        orderBy: { version: 'desc' },
      });
      if (!template) {
        rejected++;
        errors.push({ r, reason: 'no active template' });
        continue;
      }

      if (dryRun) {
        accepted++;
        continue;
      }

      await prisma.$transaction(async (tx) => {
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
          where: {
            thanaId: thana.id,
            reportTypeId: type.id,
            reportingPeriodId: period.id,
            status: ReportStatus.APPROVED,
          },
        });
        if (existing) {
          rejected++;
          errors.push({ r, reason: 'approved report already exists' });
          return;
        }

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
            data: {
              reportId: report.id,
              fieldId,
              valueNum: v.valueNum ?? null,
              valueText: v.valueText ?? null,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            action: 'IMPORT',
            entity: 'Report',
            entityId: report.id,
            meta: { source: file, thanaCode: thana.code, periodLabel: r.periodLabel },
          },
        });

        accepted++;
      });
    } catch (e: any) {
      rejected++;
      errors.push({ r, reason: e.message });
    }
  }

  console.log(JSON.stringify({ dryRun, accepted, rejected, errors: errors.slice(0, 20) }, null, 2));
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });