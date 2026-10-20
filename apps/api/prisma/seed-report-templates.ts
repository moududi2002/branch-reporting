// apps/api/prisma/seed-report-templates.ts
// ... existing imports and helpers unchanged ...

// ---- NEW: Monthly report — কর্মী বৃদ্ধি তালিকা ----
async function seedMonthlyExtras() {
  const type = await prisma.reportType.findUniqueOrThrow({ where: { code: ReportTypeCode.MONTHLY } });
  const tpl = await prisma.reportTemplate.findFirstOrThrow({
    where: { reportTypeId: type.id, isActive: true },
    orderBy: { version: 'desc' },
  });

  const growth = await section(tpl.id, 'monthly.employeeGrowth', 'কর্মী বৃদ্ধি তালিকা : মানোন্নয়ন', 99, {
    layout: 'employee-growth',
    columns: [
      'ক্রম', 'নাম', 'থানা কোড',
      'শিক্ষাপ্রতিষ্ঠানের ধরন — ক্যাটাগরি', 'শিক্ষাপ্রতিষ্ঠানের ধরন — সাব-ক্যাটাগরি',
      'শ্রেণি/বর্ষ', 'বিষয়/বিভাগ', 'দায়িত্ব', 'কর্মী হওয়ার তারিখ',
      'পেশাগত টার্গেট — সেক্টর', 'পেশাগত টার্গেট — সাব-সেক্টর',
      'রক্তগ্রুপ', 'নিজ জেলা', 'উপজেলা',
    ],
    columnTypes: ['number', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'date', 'text', 'text', 'text', 'text', 'text'],
  });

  await field({
    templateId: tpl.id,
    sectionId: growth.id,
    key: 'monthly.employeeGrowth.table',
    labelBn: 'কর্মী বৃদ্ধি তালিকা',
    fieldType: FieldType.TABLE_ROWS,
    order: 1,
    layoutMeta: {
      columns: [
        'ক্রম', 'নাম', 'থানা কোড',
        'শিক্ষাপ্রতিষ্ঠানের ধরন — ক্যাটাগরি', 'শিক্ষাপ্রতিষ্ঠানের ধরন — সাব-ক্যাটাগরি',
        'শ্রেণি/বর্ষ', 'বিষয়/বিভাগ', 'দায়িত্ব', 'কর্মী হওয়ার তারিখ',
        'পেশাগত টার্গেট — সেক্টর', 'পেশাগত টার্গেট — সাব-সেক্টর',
        'রক্তগ্রুপ', 'নিজ জেলা', 'উপজেলা',
      ],
      columnTypes: ['number', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'date', 'text', 'text', 'text', 'text', 'text'],
      minRows: 2,
    },
  });
}

// ---- Financial comment band ----
async function seedFinancialComment() {
  const type = await prisma.reportType.findUniqueOrThrow({ where: { code: ReportTypeCode.FINANCIAL } });
  const tpl = await prisma.reportTemplate.findFirstOrThrow({
    where: { reportTypeId: type.id, isActive: true },
    orderBy: { version: 'desc' },
  });
  const sec = await section(tpl.id, 'fin.comment', 'মন্তব্য', 4);
  await field({
    templateId: tpl.id,
    sectionId: sec.id,
    key: 'fin.comment.text',
    labelBn: 'মন্তব্য',
    fieldType: FieldType.TEXTAREA,
    order: 1,
  });
}
// apps/api/prisma/seed-report-templates.ts (main function)
async function main() {
  await seedComment();
  await seedTour();
  await seedFinancial();
  await seedFinancialComment();   // NEW
  await seedMatrix();
  await seedMonthlyExtras();      // NEW
}