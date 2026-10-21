// apps/api/prisma/seed-report-templates.ts
// apps/api/prisma/seed-report-templates.ts
import { PrismaClient, FieldType, CalculationRule, AggregationRule, ReportTypeCode } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureTemplate(code: ReportTypeCode, nameBn: string) {
  const type = await prisma.reportType.findUniqueOrThrow({ where: { code } });
  const tpl = await prisma.reportTemplate.upsert({
    where: { reportTypeId_version: { reportTypeId: type.id, version: 1 } },
    update: {},
    create: { reportTypeId: type.id, version: 1, nameBn },
  });
  return { type, tpl };
}

async function section(templateId: string, key: string, titleBn: string, order: number, layoutMeta?: any) {
  return prisma.reportSection.upsert({
    where: { reportTemplateId_key: { reportTemplateId: templateId, key } },
    update: {},
    create: { reportTemplateId: templateId, key, titleBn, order, layoutMeta: layoutMeta ?? null },
  });
}

async function field(data: {
  templateId: string;
  sectionId?: string;
  key: string;
  labelBn: string;
  fieldType: FieldType;
  order: number;
  isReadOnly?: boolean;
  isRequired?: boolean;
  calculationRule?: CalculationRule;
  aggregationRule?: AggregationRule;
  options?: any;
  layoutMeta?: any;
}) {
  await prisma.reportField.upsert({
    where: { reportTemplateId_key: { reportTemplateId: data.templateId, key: data.key } },
    update: {},
    create: {
      reportTemplateId: data.templateId,
      sectionId: data.sectionId,
      key: data.key,
      labelBn: data.labelBn,
      fieldType: data.fieldType,
      order: data.order,
      isReadOnly: data.isReadOnly ?? false,
      isRequired: data.isRequired ?? false,
      calculationRule: data.calculationRule ?? CalculationRule.NONE,
      aggregationRule: data.aggregationRule ?? AggregationRule.NONE,
      options: data.options ?? null,
      layoutMeta: data.layoutMeta ?? null,
    },
  });
}

async function seedComment() {
  const { tpl } = await ensureTemplate(ReportTypeCode.COMMENT, 'মন্তব্য প্রতিবেদন v1');
  const intro = await section(tpl.id, 'comment.intro', 'ভূমিকা', 1);
  const problem = await section(tpl.id, 'comment.problems', 'সমস্যা সমূহ', 2);
  const prospect = await section(tpl.id, 'comment.prospects', 'সম্ভাবনা সমূহ', 2);
  const action = await section(tpl.id, 'comment.actions', 'করণীয় সমূহ', 3, { fullWidth: true });
  const conclusion = await section(tpl.id, 'comment.conclusion', 'উপসংহার', 4);

  await field({ templateId: tpl.id, sectionId: intro.id, key: 'comment.intro.text', labelBn: 'পরিচিতিমূলক অনুচ্ছেদ', fieldType: FieldType.TEXTAREA, order: 1, aggregationRule: AggregationRule.TEXT_JOIN });
  for (let i = 1; i <= 4; i++) {
    await field({ templateId: tpl.id, sectionId: problem.id, key: `comment.problem.${i}`, labelBn: `সমস্যা ${i}`, fieldType: FieldType.TEXTAREA, order: i });
  }
  for (let i = 1; i <= 2; i++) {
    await field({ templateId: tpl.id, sectionId: prospect.id, key: `comment.prospect.${i}`, labelBn: `সম্ভাবনা ${i}`, fieldType: FieldType.TEXTAREA, order: i });
  }
  for (let i = 1; i <= 4; i++) {
    await field({ templateId: tpl.id, sectionId: action.id, key: `comment.action.${i}`, labelBn: `করণীয় ${i}`, fieldType: FieldType.TEXTAREA, order: i });
  }
  await field({ templateId: tpl.id, sectionId: conclusion.id, key: 'comment.conclusion.text', labelBn: 'উপসংহার / ভবিষ্যৎ পরিকল্পনা', fieldType: FieldType.TEXTAREA, order: 1, aggregationRule: AggregationRule.TEXT_JOIN });
}

const TOUR_ROLES = [
  'মুহতারাম, জেলা সভাপতি',
  'সম্মানিত, জেলা সেক্রেটারি',
  'জেলা H.R.D সম্পাদক',
  'জেলা সাহিত্য সম্পাদক',
  'জেলা বিজ্ঞান ও ছাত্র আন্দোলন সম্পাদক',
  'জেলা মাদরাসা সম্পাদক',
  'থানা সভাপতি',
  'থানা সেক্রেটারি',
  'থানা সাংগঠনিক সম্পাদক',
  'থানা অফিস সম্পাদক',
  'থানা অর্থ সম্পাদক',
  'থানা সাহিত্য সম্পাদক',
];

const TOUR_PURPOSES = [
  'প্রোগ্রাম বাস্তবায়ন',
  'যোগাযোগ ও প্রোগ্রাম বাস্তবায়ন',
  'সার্বিক যোগাযোগ ও প্রোগ্রাম বাস্তবায়ন',
  'সার্বিক যোগাযোগ ও অর্থ কালেকশন',
];

async function seedTour() {
  const { tpl } = await ensureTemplate(ReportTypeCode.TOUR, 'সফর রিপোর্ট v1');
  const s = await section(tpl.id, 'tour.rows', 'সফর', 1, { columns: ['দায়িত্ব', 'উপলক্ষ্য', 'দিন', 'বার'], rowCount: TOUR_ROLES.length });
  await field({
    templateId: tpl.id,
    sectionId: s.id,
    key: 'tour.table',
    labelBn: 'সফর তালিকা',
    fieldType: FieldType.TABLE_ROWS,
    order: 1,
    layoutMeta: { roles: TOUR_ROLES, purposes: TOUR_PURPOSES },
  });
}

async function seedFinancial() {
  const { tpl } = await ensureTemplate(ReportTypeCode.FINANCIAL, 'অর্থনৈতিক প্রতিবেদন v1');
  const income = await section(tpl.id, 'fin.income', 'আয়', 1, { columns: ['আয়ের উৎস', 'মোট সংখ্যা', 'বৃদ্ধি সংখ্যা', 'ধার্য পরিমাণ', 'আদায় সংখ্যা', 'প্রাপ্ত টাকা'] });
  const expense = await section(tpl.id, 'fin.expense', 'ব্যয়', 2, { columns: ['ব্যয়ের খাত', 'পরিমাণ'] });
  const totals = await section(tpl.id, 'fin.totals', 'সর্বমোট', 3);

  const incomeRows = ['জনশক্তি', 'শুভাকাঙ্ক্ষী', 'শাখা এয়ানত', 'এককালীন', 'বিশেষ', 'যাকাত', 'ছাত্রকল্যাণ', 'খেলার রেজিঃ ফি', 'কোচিং/গাইড', 'ঋণ গ্রহণ', 'সাহিত্য বিভাগ', 'ঈদ সামগ্রী', 'আবাসন', 'সদস্য সম্মেলন/বার্ষিক কালেকশন', 'পেশাজীবী', 'ঊর্ধ্বতন সংগঠন থেকে প্রাপ্ত', 'অফিস ভাড়া'];
  let i = 1;
  for (const r of incomeRows) {
    await field({ templateId: tpl.id, sectionId: income.id, key: `fin.income.${r}.amount`, labelBn: `${r} — প্রাপ্ত টাকা`, fieldType: FieldType.NUMBER, order: i++, aggregationRule: AggregationRule.ADDITIVE, calculationRule: CalculationRule.ADDITIVE });
  }

  const expenseRows = ['ঊর্ধ্বতন এয়ানত', 'যাতায়াত', 'অফিস স্টেশনারি', 'আপ্যায়ন', 'সম্পদ মেরামত', 'যাকাত', 'বিভাগীয়', 'সফর খরচ', 'ডাক ও তার', 'ছাত্রকল্যাণ', 'প্রোগ্রাম বাস্তবায়ন', 'সাহিত্য', 'প্রকাশনী', 'আবাসন', 'সহযোগী সংগঠন', 'দাওয়াতী কার্যক্রম', 'সম্পদ ক্রয়', 'ডেলিগেট ফি', 'সাবসিডি', 'শহীদ ফান্ড'];
  let j = 1;
  for (const r of expenseRows) {
    await field({ templateId: tpl.id, sectionId: expense.id, key: `fin.expense.${r}.amount`, labelBn: `${r} — পরিমাণ`, fieldType: FieldType.NUMBER, order: j++, aggregationRule: AggregationRule.ADDITIVE, calculationRule: CalculationRule.ADDITIVE });
  }

  await field({ templateId: tpl.id, sectionId: totals.id, key: 'fin.total.income', labelBn: 'এ মাসের মোট আয়', fieldType: FieldType.NUMBER, order: 1, isReadOnly: true, calculationRule: CalculationRule.ADDITIVE });
  await field({ templateId: tpl.id, sectionId: totals.id, key: 'fin.total.expense', labelBn: 'এ মাসের মোট ব্যয়', fieldType: FieldType.NUMBER, order: 2, isReadOnly: true, calculationRule: CalculationRule.ADDITIVE });
  await field({ templateId: tpl.id, sectionId: totals.id, key: 'fin.surplus', labelBn: 'উদ্বৃত্ত', fieldType: FieldType.NUMBER, order: 3, isReadOnly: true, calculationRule: CalculationRule.DIFFERENCE });
}

const MATRIX_ROWS: Array<{ label: string; group?: string[] }> = [
  { label: 'সরকারি বিশ্ববিদ্যালয়' },
  { label: 'বেসরকারি বিশ্ববিদ্যালয়', group: ['মূল ক্যাম্পাস', 'শাখা ক্যাম্পাস'] },
  { label: 'প্রকৌশল বিশ্ববিদ্যালয়' },
  { label: 'কৃষি বিশ্ববিদ্যালয়' },
  { label: 'টেক্সটাইল ইঞ্জি.' },
  { label: 'সরকারি ভ্যাটেরিনারি বিশ্ব.' },
  { label: 'মেডিক্যাল বিশ্ববিদ্যালয়' },
  { label: 'মেডিক্যাল কলেজ', group: ['সরকারি', 'বেসরকারি', 'হোমিও', 'ইউনানী/আয়ুর্বেদী'] },
  { label: 'কলেজ', group: ['সরকারি', 'বেসরকারি'] },
  { label: 'বি এড.কলেজ' },
  { label: 'আইন কলেজ' },
  { label: 'আদর্শ কলেজ' },
  { label: 'কৃষি কলেজ' },
  { label: 'কর্মাশিয়াল কলেজ' },
  { label: 'গ্রাফিক্স আর্টস কলেজ' },
  { label: 'শারীরিক শিক্ষা কলেজ' },
  { label: 'টেকনিক্যাল কলেজ' },
  { label: 'পলিটেকনিক ইনস্টিটিউট', group: ['সরকারি', 'বেসরকারি'] },
  { label: 'টেক্সটাইল ইনস্টিটিউট', group: ['সরকারি', 'বেসরকারি'] },
];

async function seedMatrix() {
  const { tpl } = await ensureTemplate(ReportTypeCode.INSTITUTION_MATRIX, 'প্রতিষ্ঠানভিত্তিক ম্যাট্রিক্স v1');
  const s = await section(tpl.id, 'matrix.rows', 'প্রতিষ্ঠানভিত্তিক হিসাব', 1, { rows: MATRIX_ROWS });
  // A single TABLE_ROWS field that stores all institution rows as JSON array
  await field({
    templateId: tpl.id,
    sectionId: s.id,
    key: 'matrix.table',
    labelBn: 'ইনস্টিটিউশন ম্যাট্রিক্স',
    fieldType: FieldType.TABLE_ROWS,
    order: 1,
    layoutMeta: {
      rows: MATRIX_ROWS,
      columns: [
        'প্রতিষ্ঠান — পূর্ব সংখ্যা', 'প্রতিষ্ঠান — সংখ্যা', 'প্রতিষ্ঠান — বৃদ্ধি', 'প্রতিষ্ঠান — ঘাটতি',
        'সংগঠন — পূর্ব সংখ্যা', 'সংগঠন — সংখ্যা', 'সংগঠন — নেই', 'সংগঠন — বৃদ্ধি', 'সংগঠন — ঘাটতি',
        'মানের সংগঠন — থানা', 'মানের সংগঠন — ওয়ার্ড', 'মানের সংগঠন — উপশাখা',
        'সমর্থক সংগঠন — পূর্ব', 'সমর্থক সংগঠন — সংখ্যা', 'সমর্থক সংগঠন — বৃদ্ধি', 'সমর্থক সংগঠন — ঘাটতি',
        'মোট উপশাখা — পূর্ব', 'মোট উপশাখা — সংখ্যা', 'মোট উপশাখা — বৃদ্ধি', 'মোট উপশাখা — ঘাটতি',
        'কর্মী — পূর্ব', 'কর্মী — বর্তমান', 'সাথী — পূর্ব', 'সাথী — বর্তমান', 'সদস্য — পূর্ব', 'সদস্য — বর্তমান', 'মোট — পূর্ব', 'মোট — বর্তমান',
        'সমর্থক', 'অন্যান্য ছাত্র সংগঠনের কর্মী', 'মোট ছাত্রী সংখ্যা', 'ছাত্রী সমর্থক', 'অমুসলিম ছাত্র ছাত্রী', 'মোট ছাত্র-ছাত্রী সংখ্যা',
      ],
    },
  });
}

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

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

