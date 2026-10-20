// apps/api/prisma/seed-matrix-full.ts
import { ReportTypeCode, FieldType } from '@prisma/client';
import { prisma, section, field } from './seed-helpers';

const MATRIX_COLUMNS = [
  'প্রতিষ্ঠান — পূর্ব সংখ্যা', 'প্রতিষ্ঠান — সংখ্যা', 'প্রতিষ্ঠান — বৃদ্ধি', 'প্রতিষ্ঠান — ঘাটতি',
  'সংগঠন — পূর্ব সংখ্যা', 'সংগঠন — সংখ্যা', 'সংগঠন — নেই', 'সংগঠন — বৃদ্ধি', 'সংগঠন — ঘাটতি',
  'মানের সংগঠন — থানা', 'মানের সংগঠন — ওয়ার্ড', 'মানের সংগঠন — উপশাখা',
  'সমর্থক সংগঠন — পূর্ব', 'সমর্থক সংগঠন — সংখ্যা', 'সমর্থক সংগঠন — বৃদ্ধি', 'সমর্থক সংগঠন — ঘাটতি',
  'মোট উপশাখা — পূর্ব', 'মোট উপশাখা — সংখ্যা', 'মোট উপশাখা — বৃদ্ধি', 'মোট উপশাখা — ঘাটতি',
  'কর্মী — পূর্ব', 'কর্মী — বর্তমান', 'সাথী — পূর্ব', 'সাথী — বর্তমান',
  'সদস্য — পূর্ব', 'সদস্য — বর্তমান', 'মোট — পূর্ব', 'মোট — বর্তমান',
  'সমর্থক', 'অন্যান্য ছাত্র সংগঠনের কর্মী', 'মোট ছাত্রী সংখ্যা', 'ছাত্রী সমর্থক', 'অমুসলিম ছাত্র ছাত্রী', 'মোট ছাত্র-ছাত্রী সংখ্যা',
];

const PAGE1_ROWS = [
  { label: 'সরকারি বিশ্ববিদ্যালয়' },
  { label: 'বেসরকারি বিশ্ববিদ্যালয়', group: ['মূল ক্যাম্পাস', 'শাখা ক্যাম্পাস'] },
  { label: 'প্রকৌশল বিশ্ববিদ্যালয়' },
  { label: 'কৃষি বিশ্ববিদ্যালয়' },
  { label: 'টেক্সটাইল ইঞ্জি.' },
  { label: 'সরকারি ভ্যাটেরিনারি বিশ্ব.' },
  { label: 'মেডিক্যাল বিশ্ববিদ্যালয়' },
  { label: 'মেডিক্যাল কলেজ', group: ['সরকারি', 'বেসরকারি', 'হোমিও', 'ইউনানী/আয়ুর্বেদী'] },
  { label: 'কলেজ', group: ['সরকারি', 'বেসরকারি'] },
  { label: 'বি এড.কলেজ' }, { label: 'আইন কলেজ' }, { label: 'আদর্শ কলেজ' },
  { label: 'কৃষি কলেজ' }, { label: 'কর্মাশিয়াল কলেজ' }, { label: 'গ্রাফিক্স আর্টস কলেজ' },
  { label: 'শারীরিক শিক্ষা কলেজ' }, { label: 'টেকনিক্যাল কলেজ' },
  { label: 'পলিটেকনিক ইনস্টিটিউট', group: ['সরকারি', 'বেসরকারি'] },
  { label: 'টেক্সটাইল ইনস্টিটিউট', group: ['সরকারি', 'বেসরকারি'] },
];

const PAGE2_ROWS = [
  { label: 'ইঞ্জিনিয়ারিং ইনস্টিটিউট' }, { label: 'ম্যাটস' }, { label: 'ইনস্টিটিউট অব লেদার টেকনোলজি' },
  { label: 'ফরেস্ট্রি ইনস্টিটিউট' }, { label: 'আই.এইচ.টি' }, { label: 'মেরিন একাডেমী' },
  { label: 'মেরিন ফিশারিজ' }, { label: 'স্কুল এন্ড কলেজ' }, { label: 'চারুকলা কলেজ' },
  { label: 'মাদরাসা', group: ['কামিল', 'ফাজিল', 'আলিম', 'দাখিল', 'ক্যাডেট', 'কওমী', 'হাফেজিয়া'] },
  { label: 'স্কুল', group: ['সরকারি', 'বেসরকারি', 'প্রি-ক্যাডেট স্কুল', 'ইংলিশ মিডিয়াম স্কুল', 'টেকনিক্যাল স্কুল', 'ভোকেশনাল স্কুল', 'প্রাইমারী', 'কিন্ডার গার্টেন স্কুল'] },
];

export async function seedMatrixFull() {
  const type = await prisma.reportType.findUniqueOrThrow({ where: { code: ReportTypeCode.INSTITUTION_MATRIX } });
  const tpl = await prisma.reportTemplate.findFirstOrThrow({ where: { reportTypeId: type.id, isActive: true }, orderBy: { version: 'desc' } });

  // Page 1
  {
    const s = await section(tpl.id, 'matrix.page1', 'প্রতিষ্ঠানভিত্তিক হিসাব — পৃষ্ঠা ১', 1, { rows: PAGE1_ROWS, columns: MATRIX_COLUMNS });
    await field({ templateId: tpl.id, sectionId: s.id, key: 'matrix.page1.table', labelBn: 'ম্যাট্রিক্স পৃষ্ঠা ১', fieldType: FieldType.TABLE_ROWS, order: 1, layoutMeta: { rows: PAGE1_ROWS, columns: MATRIX_COLUMNS } });
    await field({ templateId: tpl.id, sectionId: s.id, key: 'matrix.page1.total', labelBn: 'এই পৃষ্ঠা মোট', fieldType: FieldType.TABLE_ROWS, order: 2, isReadOnly: true, layoutMeta: { columns: MATRIX_COLUMNS } });
  }
  // Page 2
  {
    const s = await section(tpl.id, 'matrix.page2', 'প্রতিষ্ঠানভিত্তিক হিসাব — পৃষ্ঠা ২', 2, { rows: PAGE2_ROWS, columns: MATRIX_COLUMNS });
    await field({ templateId: tpl.id, sectionId: s.id, key: 'matrix.page2.carryForward', labelBn: 'প্রথম পাতা থেকে', fieldType: FieldType.TABLE_ROWS, order: 1, isReadOnly: true, layoutMeta: { columns: MATRIX_COLUMNS } });
    await field({ templateId: tpl.id, sectionId: s.id, key: 'matrix.page2.table', labelBn: 'ম্যাট্রিক্স পৃষ্ঠা ২', fieldType: FieldType.TABLE_ROWS, order: 2, layoutMeta: { rows: PAGE2_ROWS, columns: MATRIX_COLUMNS } });
    await field({ templateId: tpl.id, sectionId: s.id, key: 'matrix.page2.grandTotal', labelBn: 'সর্বমোট', fieldType: FieldType.TABLE_ROWS, order: 3, isReadOnly: true, layoutMeta: { columns: MATRIX_COLUMNS } });
  }
}