// apps/api/prisma/seed-financial-full.ts
import { ReportTypeCode, FieldType } from '@prisma/client';
import { prisma, section, field } from './seed-helpers';

const FULL_INCOME_ROWS = ['জনশক্তি', 'শুভাকাঙ্ক্ষী', 'শাখা এয়ানত'];
const SIMPLE_INCOME_ROWS = ['এককালীন', 'বিশেষ', 'যাকাত', 'ছাত্রকল্যাণ', 'খেলার রেজিঃ ফি', 'কোচিং/গাইড', 'ঋণ গ্রহণ', 'সাহিত্য বিভাগ', 'ঈদ সামগ্রী', 'আবাসন', 'সদস্য সম্মেলন/বার্ষিক কালেকশন', 'পেশাজীবী', 'ঊর্ধ্বতন সংগঠন থেকে প্রাপ্ত', 'অফিস ভাড়া'];

const EXPENSE_ROWS = ['ঊর্ধ্বতন এয়ানত', 'যাতায়াত', 'অফিস স্টেশনারি', 'আপ্যায়ন', 'সম্পদ মেরামত', 'যাকাত', 'বিভাগীয়', 'সফর খরচ', 'ডাক ও তার', 'ছাত্রকল্যাণ', 'প্রোগ্রাম বাস্তবায়ন', 'সাহিত্য', 'প্রকাশনী', 'আবাসন', 'সহযোগী সংগঠন', 'দাওয়াতী কার্যক্রম', 'সম্পদ ক্রয়', 'ডেলিগেট ফি', 'সাবসিডি', 'শহীদ ফান্ড'];

export async function seedFinancialFull() {
  const type = await prisma.reportType.findUniqueOrThrow({ where: { code: ReportTypeCode.FINANCIAL } });
  const tpl = await prisma.reportTemplate.findFirstOrThrow({ where: { reportTypeId: type.id, isActive: true }, orderBy: { version: 'desc' } });

  // Income section
  {
    const s = await section(tpl.id, 'fin.income.full', 'আয়', 1);
    let o = 1;
    for (const r of FULL_INCOME_ROWS) {
      for (const k of ['total', 'growth', 'fixed', 'collected', 'received']) {
        await field({ templateId: tpl.id, sectionId: s.id, key: `fin.income.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: FieldType.NUMBER, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
    for (const r of SIMPLE_INCOME_ROWS) {
      await field({ templateId: tpl.id, sectionId: s.id, key: `fin.income.${r}.received`, labelBn: `${r} — প্রাপ্ত টাকা`, fieldType: FieldType.NUMBER, order: o++, aggregationRule: 'ADDITIVE' });
    }
  }

  // Expense quota
  {
    const s = await section(tpl.id, 'fin.expense.quota', 'ঊর্ধ্বতন এয়ানত ধার্য কোটা', 2);
    await field({ templateId: tpl.id, sectionId: s.id, key: 'fin.expense.quota.amount', labelBn: 'ধার্য কোটা', fieldType: FieldType.NUMBER, order: 1 });
  }

  // Expense rows
  {
    const s = await section(tpl.id, 'fin.expense.full', 'ব্যয়', 3);
    let o = 1;
    for (const r of EXPENSE_ROWS) {
      await field({ templateId: tpl.id, sectionId: s.id, key: `fin.expense.${r}.amount`, labelBn: `${r} — পরিমাণ`, fieldType: FieldType.NUMBER, order: o++, aggregationRule: 'ADDITIVE' });
    }
  }

  // Totals
  {
    const s = await section(tpl.id, 'fin.totals.full', 'সর্বমোট', 4);
    const totals = [
      ['fin.total.monthIncome', 'এ মাসের মোট আয়'],
      ['fin.total.prevSurplus', 'গত মাসের উদ্বৃত্ত'],
      ['fin.total.grandIncome', 'সর্বমোট আয়'],
      ['fin.total.grandExpense', 'সর্বমোট ব্যয়'],
      ['fin.total.surplus', 'উদ্বৃত্ত'],
      ['fin.total.monthExpense', 'এ মাসের মোট ব্যয়'],
      ['fin.total.prevDeficit', 'গত মাসের ঘাটতি'],
    ];
    let o = 1;
    for (const [key, label] of totals) {
      await field({ templateId: tpl.id, sectionId: s.id, key, labelBn: label, fieldType: FieldType.NUMBER, order: o++, isReadOnly: true });
    }
  }

  // Comment band
  {
    const s = await section(tpl.id, 'fin.comment.full', 'মন্তব্য', 5);
    await field({ templateId: tpl.id, sectionId: s.id, key: 'fin.comment.text', labelBn: 'মন্তব্য', fieldType: FieldType.TEXTAREA, order: 1 });
  }
}