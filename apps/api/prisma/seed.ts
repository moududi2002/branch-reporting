// apps/api/prisma/seed.ts
import { PrismaClient, Role, ReportTypeCode, FieldType, CalculationRule, AggregationRule } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@12345', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: { email: 'superadmin@example.com', passwordHash, fullName: 'Super Admin', role: Role.SUPER_ADMIN },
  });

  const types = [
    { code: ReportTypeCode.MONTHLY, nameBn: 'মাসিক রিপোর্ট' },
    { code: ReportTypeCode.FINANCIAL, nameBn: 'অর্থনৈতিক প্রতিবেদন' },
    { code: ReportTypeCode.INSTITUTION_MATRIX, nameBn: 'প্রতিষ্ঠানভিত্তিক ম্যাট্রিক্স' },
    { code: ReportTypeCode.COMMENT, nameBn: 'মন্তব্য প্রতিবেদন' },
    { code: ReportTypeCode.TOUR, nameBn: 'সফর রিপোর্ট' },
  ];
  for (const t of types) {
    await prisma.reportType.upsert({ where: { code: t.code }, update: { nameBn: t.nameBn }, create: t });
  }

  // ---- Monthly template v1 (skeleton example: জনশক্তি section) ----
  const monthly = await prisma.reportType.findUniqueOrThrow({ where: { code: ReportTypeCode.MONTHLY } });
  const tpl = await prisma.reportTemplate.upsert({
    where: { reportTypeId_version: { reportTypeId: monthly.id, version: 1 } },
    update: {},
    create: { reportTypeId: monthly.id, version: 1, nameBn: 'মাসিক রিপোর্ট v1' },
  });

  const jonshoshi = await prisma.reportSection.upsert({
    where: { reportTemplateId_key: { reportTemplateId: tpl.id, key: 'jonshoshi' } },
    update: {},
    create: {
      reportTemplateId: tpl.id,
      key: 'jonshoshi',
      titleBn: 'জনশক্তি',
      order: 1,
      layoutMeta: { grid: true, headerGroups: ['prev', 'current', 'growth', 'target', 'achievement', 'deficit'] },
    },
  });

  const rows = ['সদস্য', 'সদস্য প্রার্থী', 'সাথী', 'সাথী প্রার্থী', 'কর্মী', 'মোট'];
  let order = 1;
  for (const row of rows) {
    // previous (read-only, auto-loaded)
    await prisma.reportField.upsert({
      where: { reportTemplateId_key: { reportTemplateId: tpl.id, key: `jonshoshi.${row}.prev` } },
      update: {},
      create: {
        reportTemplateId: tpl.id,
        sectionId: jonshoshi.id,
        key: `jonshoshi.${row}.prev`,
        labelBn: `${row} — পূর্বের সংখ্যা`,
        fieldType: FieldType.NUMBER,
        calculationRule: CalculationRule.NONE,
        aggregationRule: AggregationRule.SNAPSHOT_LAST,
        isReadOnly: true,
        order: order++,
      },
    });
    // current
    await prisma.reportField.upsert({
      where: { reportTemplateId_key: { reportTemplateId: tpl.id, key: `jonshoshi.${row}.current` } },
      update: {},
      create: {
        reportTemplateId: tpl.id,
        sectionId: jonshoshi.id,
        key: `jonshoshi.${row}.current`,
        labelBn: `${row} — বর্তমান সংখ্যা`,
        fieldType: FieldType.NUMBER,
        calculationRule: CalculationRule.NONE,
        aggregationRule: AggregationRule.SNAPSHOT_LAST,
        isReadOnly: false,
        order: order++,
      },
    });
    // growth (auto-calculated)
    await prisma.reportField.upsert({
      where: { reportTemplateId_key: { reportTemplateId: tpl.id, key: `jonshoshi.${row}.growth` } },
      update: {},
      create: {
        reportTemplateId: tpl.id,
        sectionId: jonshoshi.id,
        key: `jonshoshi.${row}.growth`,
        labelBn: `${row} — বৃদ্ধি`,
        fieldType: FieldType.NUMBER,
        calculationRule: CalculationRule.DIFFERENCE,
        aggregationRule: AggregationRule.ADDITIVE,
        isReadOnly: true,
        formula: `jonshoshi.${row}.current - jonshoshi.${row}.prev`,
        order: order++,
      },
    });
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });