// apps/api/prisma/seed-monthly-full.ts
import { FieldType, CalculationRule, AggregationRule, ReportTypeCode } from '@prisma/client';
import { prisma, section, field } from './seed-helpers';

const N = FieldType.NUMBER;
const T = FieldType.TEXT;
const TA = FieldType.TEXTAREA;

export async function seedMonthlyFull() {
  const type = await prisma.reportType.findUniqueOrThrow({ where: { code: ReportTypeCode.MONTHLY } });
  const tpl = await prisma.reportTemplate.findFirstOrThrow({
    where: { reportTypeId: type.id, isActive: true },
    orderBy: { version: 'desc' },
  });
  const T0 = tpl.id;

  // ---------- P1-1 জনশক্তি ----------
  {
    const s = await section(T0, 'p1.jonoshokti', 'জনশক্তি', 1, {
      headerGroups: ['পূর্বের সংখ্যা', 'বর্তমান সংখ্যা', 'বৃদ্ধি', 'টার্গেট', 'বাস্তবায়ন হার %', 'ঘাটতি', 'মূল ঘাটতি'],
    });
    const rows = ['সদস্য', 'সদস্য প্রার্থী', 'সাথী', 'সাথী প্রার্থী', 'কর্মী', 'মোট'];
    const growthSub = ['সংখ্যা', 'মান উন্নয়ন', 'আগমন'];
    const deficitSub = ['সংখ্যা', 'মান উন্নয়ন', 'ছাত্রত্ব শেষ', 'স্থানান্তর', 'বাতিল', 'চাকুরি', 'ইস্তফা', 'শাহাদাত'];
    let o = 1;
    for (const r of rows) {
      await field({ templateId: T0, sectionId: s.id, key: `jonoshokti.${r}.prev`, labelBn: `${r} — পূর্বের সংখ্যা`, fieldType: N, order: o++, isReadOnly: true, aggregationRule: 'SNAPSHOT_LAST' });
      await field({ templateId: T0, sectionId: s.id, key: `jonoshokti.${r}.current`, labelBn: `${r} — বর্তমান সংখ্যা`, fieldType: N, order: o++, aggregationRule: 'SNAPSHOT_LAST' });
      for (const g of growthSub)
        await field({ templateId: T0, sectionId: s.id, key: `jonoshokti.${r}.growth.${g}`, labelBn: `${r} — বৃদ্ধি — ${g}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      await field({ templateId: T0, sectionId: s.id, key: `jonoshokti.${r}.target`, labelBn: `${r} — টার্গেট`, fieldType: N, order: o++ });
      await field({ templateId: T0, sectionId: s.id, key: `jonoshokti.${r}.achievement`, labelBn: `${r} — বাস্তবায়ন হার %`, fieldType: N, order: o++, isReadOnly: true, calculationRule: 'FORMULA', formula: 'current/target*100' });
      for (const g of deficitSub)
        await field({ templateId: T0, sectionId: s.id, key: `jonoshokti.${r}.deficit.${g}`, labelBn: `${r} — ঘাটতি — ${g}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      await field({ templateId: T0, sectionId: s.id, key: `jonoshokti.${r}.deficit.total`, labelBn: `${r} — মূল ঘাটতি`, fieldType: N, order: o++, isReadOnly: true, calculationRule: 'FORMULA', formula: 'sum(deficit.*)' });
    }
  }

  // ---------- P1-2 দাওয়াত ----------
  {
    const s = await section(T0, 'p1.dawat', 'দাওয়াত', 2, {
      note: 'বৃদ্ধি (আগে ৪০ নং পৃষ্ঠা পূরণ করুন)',
      headerGroups: ['পূর্বের সংখ্যা', 'বর্তমান সংখ্যা', 'বৃদ্ধি', 'টার্গেট', 'ঘাটতি'],
    });
    const rows = ['সমর্থক', 'বন্ধু', 'অমুসলিম সমর্থক', 'অমুসলিম বন্ধু', 'শুভাকাঙ্ক্ষী'];
    const growthSub = ['মোট বৃদ্ধি', 'ব্যক্তিগত দাওয়াত', 'গ্রুপ দাওয়াত', 'সাধারণ দাওয়াতি দশক', 'স্কুল দাওয়াতি দশক', 'মাদরাসা দাওয়াতি দশক', 'কলেজ দাওয়াতি সপ্তাহ', 'দাওয়াতি পক্ষ/দশক', 'বাস্তবায়ন হার'];
    let o = 1;
    for (const r of rows) {
      await field({ templateId: T0, sectionId: s.id, key: `dawat.${r}.prev`, labelBn: `${r} — পূর্বের সংখ্যা`, fieldType: N, order: o++, isReadOnly: true, aggregationRule: 'SNAPSHOT_LAST' });
      await field({ templateId: T0, sectionId: s.id, key: `dawat.${r}.current`, labelBn: `${r} — বর্তমান সংখ্যা`, fieldType: N, order: o++, aggregationRule: 'SNAPSHOT_LAST' });
      for (const g of growthSub)
        await field({ templateId: T0, sectionId: s.id, key: `dawat.${r}.growth.${g}`, labelBn: `${r} — বৃদ্ধি — ${g}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      await field({ templateId: T0, sectionId: s.id, key: `dawat.${r}.target`, labelBn: `${r} — টার্গেট`, fieldType: N, order: o++ });
      await field({ templateId: T0, sectionId: s.id, key: `dawat.${r}.deficit`, labelBn: `${r} — ঘাটতি`, fieldType: N, order: o++, isReadOnly: true, calculationRule: 'DIFFERENCE', formula: 'target-current' });
    }
  }

  // ---------- P1-3 মানোন্নয়ন ----------
  {
    const s = await section(T0, 'p1.manonnoi', 'আউটপুট ক্যাটাগরিভুক্তদের মধ্য থেকে মানোন্নয়ন', 3, {
      rowLabels: ['সদস্য হয়েছেন', 'সাথী হয়েছেন', 'কর্মী হয়েছেন', 'সমর্থক হয়েছেন'],
      columnGroups: [
        'শিক্ষা প্রতিষ্ঠানভিত্তিক (১–৯)', 'JSC/JDC', 'SSC', 'HSC',
        'বিশ্ববিদ্যালয়/ক্যাম্পাস', 'অধ্যয়নরত', 'পরিবার/মাধ্যমিক', 'বিজ্ঞান/বিভাগ',
        'সরকারি বিশ্ববিদ্যালয়ে অধ্যয়নরত — প্রকৌশল', 'কৃষি শিক্ষা', 'সাধারণ বিজ্ঞান', 'ব্যবসায় শিক্ষা', 'মানবিক',
      ],
    });
    const outRows = ['member', 'sathi', 'kormi', 'somorthok'];
    let o = 1;
    for (const r of outRows) {
      await field({ templateId: T0, sectionId: s.id, key: `manonnoi.${r}.prev`, labelBn: `${r} — পূর্বের সংখ্যা`, fieldType: N, order: o++, isReadOnly: true, aggregationRule: 'SNAPSHOT_LAST' });
      await field({ templateId: T0, sectionId: s.id, key: `manonnoi.${r}.current`, labelBn: `${r} — বর্তমান সংখ্যা`, fieldType: N, order: o++, aggregationRule: 'SNAPSHOT_LAST' });
      await field({ templateId: T0, sectionId: s.id, key: `manonnoi.${r}.growth`, labelBn: `${r} — বৃদ্ধি`, fieldType: N, order: o++, isReadOnly: true, calculationRule: 'DIFFERENCE' });
    }
  }

  // ---------- P1-4 অতিরিক্ত দাওয়াত ----------
  {
    const s = await section(T0, 'p1.extraDawat', 'অতিরিক্ত দাওয়াত', 4);
    const rows = ['ব্যক্তিগত দাওয়াত', 'গ্রুপ দাওয়াতি কাজ', 'মুহাররামদের মাঝে', 'আত্মীয় ও প্রতিবেশী'];
    let o = 1;
    for (const r of rows) {
      for (const k of ['prev', 'current', 'growth', 'received', 'friendGrowth', 'supporterGrowth', 'extraDawat', 'total']) {
        await field({ templateId: T0, sectionId: s.id, key: `extraDawat.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P1-5 মসজিদভিত্তিক কাজ ----------
  {
    const s = await section(T0, 'p1.mosque', 'মসজিদভিত্তিক কাজ', 5);
    const cols = ['মোট মসজিদ সংখ্যা', 'কাজ হয় কতটি মসজিদে', 'কাজ বৃদ্ধি কতটিতে', 'দারসে কুরআন', 'হাদিস পাঠ', 'বক্তব্য', 'অন্যান্য'];
    let o = 1;
    for (const c of cols) {
      await field({ templateId: T0, sectionId: s.id, key: `mosque.${c}`, labelBn: c, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
    }
  }

  // ---------- P1-6 দাওয়াতি উপকরণ ও প্রকাশনা ----------
  {
    const s = await section(T0, 'p1.materials', 'দাওয়াতি উপকরণ ও প্রকাশনা', 6);
    const leftRows = ['কুরআন', 'হাদিস', 'পরিচিতি', 'সাহিত্য', 'স্টিকার/কার্ড', 'রুটিন', 'ক্যালেন্ডার', 'উপহার'];
    let o = 1;
    for (const r of leftRows) {
      await field({ templateId: T0, sectionId: s.id, key: `materials.${r}.distribute`, labelBn: `${r} — বিতরণ`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      await field({ templateId: T0, sectionId: s.id, key: `materials.${r}.sale`, labelBn: `${r} — বিক্রি`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
    }
    const rightRows = ['কিশোরকণ্ঠ', 'কিশোরপাতা', 'মাসিক প্রেরণা', 'YouthWave', 'Perspective', 'ব্যাপন', 'ফুলকুঁড়ি', 'মাদরাসা দ্বি-মাসিক'];
    for (const r of rightRows) {
      for (const k of ['qty', 'sale', 'distribute', 'customerGrowth']) {
        await field({ templateId: T0, sectionId: s.id, key: `publications.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P2-1 প্রশাসনিক বিবরণ ----------
  {
    const s = await section(T0, 'p2.admin', 'প্রশাসনিক বিবরণ', 7, {
      headerGroups: ['সংখ্যা', 'সংগঠন কমিটি', 'কোন মানের সংগঠন', 'সংগঠন নেই এমন কমিটিতে ন্যূনতম একটি সমর্থক সংগঠন আছে?'],
    });
    const rows = ['থানা/উপজেলা', 'পৌরসভা', 'ইউনিয়ন', 'ওয়ার্ড — সিটি', 'ওয়ার্ড — পৌর', 'ওয়ার্ড — ইউনিয়ন'];
    let o = 1;
    for (const r of rows) {
      for (const k of ['count', 'committeeCount', 'committeeGrowth', 'committeeDeficit', 'committeeNone', 'orgThana', 'orgWard', 'orgSub', 'hasSupporter']) {
        await field({ templateId: T0, sectionId: s.id, key: `admin.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P2-2 সাংগঠনিক বিবরণ ----------
  {
    const s = await section(T0, 'p2.org', 'সাংগঠনিক বিবরণ', 8);
    const rows = ['সাংগঠনিক থানা শাখা', 'সাথী শাখা (জেলার জন্য)', 'ওয়ার্ড/ইউনিয়ন', 'সমর্থক সংগঠন', 'উপশাখা', 'পাড়া/ক্লাস ভিত্তিক কমিটি'];
    let o = 1;
    for (const r of rows) {
      for (const k of ['count', 'growthTotal', 'deficitTotal', 'institutionalPrev', 'institutionalCurrent', 'institutionalGrowth', 'institutionalDeficit', 'residentialPrev', 'residentialCurrent', 'residentialGrowth', 'residentialDeficit']) {
        await field({ templateId: T0, sectionId: s.id, key: `org.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P2-3 সভাসমূহ ----------
  {
    const s = await section(T0, 'p2.meetings', 'সভাসমূহ', 9);
    const leftRows = [
      'দায়িত্বশীল বৈঠক — শাখায়', 'দায়িত্বশীল বৈঠক — থানায়', 'দায়িত্বশীল বৈঠক — ওয়ার্ডে',
      'জরুরি দায়িত্বশীল বৈঠক', 'শাখা সেক্রেটারিয়েট বৈঠক', 'পরামর্শ সভার বৈঠক',
      'আঞ্চলিক দায়িত্বশীল বৈঠক', 'সদস্য বৈঠক', 'জরুরি সদস্য বৈঠক', 'সাথী বৈঠক',
      'জরুরি সাথী বৈঠক', 'কর্মী বৈঠক', 'সাথী সমাবেশ', 'কর্মী সমাবেশ',
      'দিবস পালন শাখা', 'দোয়া দিবস কেন্দ্র', 'দোয়া দিবস শাখা', 'প্যানেল পরিচিতি',
      'কৃতি ছাত্র সংবর্ধনা', 'নবাগত সংবর্ধনা', 'সেট আপ প্রোগ্রাম',
    ];
    const rightRows = [
      'সাধারণ সভা', 'সমর্থক সভা', 'আলোচনা সভা', 'কুইজ প্রতিযোগিতা পুরস্কার',
      'বক্তৃতা/বিতর্ক প্রতিযোগিতা', 'চা-চক্র/ফল চক্র', 'প্রতিষ্ঠাবার্ষিকী সম্মেলন',
      'ঈদ পুনর্মিলনী', 'কিশোরকণ্ঠ পাঠক ফোরাম কমিটি', 'সাথী থানা/ওয়ার্ড/ইউনিয়ন',
      'মিছিল শাখায়', 'ইসলামী শিক্ষা দিবস পালন', 'ইফতার শাখায়', 'সামাজিক ভোজ',
      'সীরাত মাহফিল/আলোচনা সভা', 'দোয়া অনুষ্ঠান (পরীক্ষার্থীদের)', 'নৌকাভ্রমণ',
      'শিক্ষাসফর', 'ক্রিকেট টুর্নামেন্ট', 'অন্যান্য',
    ];
    let o = 1;
    for (const r of [...leftRows, ...rightRows]) {
      for (const k of ['count', 'attendance', 'avg']) {
        await field({ templateId: T0, sectionId: s.id, key: `meeting.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P2-4 কেন্দ্রীয় প্রশিক্ষণ ----------
  {
    const s = await section(T0, 'p2.training', 'কেন্দ্রীয় প্রশিক্ষণ', 10);
    const leftRows = ['শিক্ষাশিবির', 'সদস্য (দশ দিন)', 'সদস্য (পাঁচ দিন)', 'সদস্য (তিন দিন)', 'সদস্য (আঞ্চলিক)', 'শাখা দায়িত্বশীল (কেন্দ্র)', 'শাখা দায়িত্বশীল (আঞ্চলিক)', 'সদস্য প্রার্থী (আঞ্চলিক)', 'বিভাগীয় দায়িত্বশীল', 'বিভাগীয় দায়িত্বশীল (অঞ্চল)', 'বিশ্ববিদ্যালয় দায়িত্বশীল', 'বিজ্ঞান ও প্রযুক্তি বিষয়ক'];
    const rightRows = ['কলেজ দায়িত্বশীল', 'স্কুল দায়িত্বশীল', 'মাদরাসা দায়িত্বশীল', 'মেডিকেল কলেজ দায়িত্বশীল', 'শিক্ষা বৈঠক', 'আঞ্চলিক দায়িত্বশীল শিক্ষা', 'আঞ্চলিক সদস্য শিক্ষা বৈঠক', 'কর্মশালা', 'ছাত্রসংসদ প্রতিনিধি', 'বিভাগীয় কর্মশালা', 'বিভাগীয় কর্মশালা (অঞ্চল)'];
    let o = 1;
    for (const r of [...leftRows, ...rightRows]) {
      for (const k of ['count', 'participants']) {
        await field({ templateId: T0, sectionId: s.id, key: `training.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P3-1 প্রশিক্ষণ (বাম) ----------
  {
    const s = await section(T0, 'p3.training', 'প্রশিক্ষণ', 11);
    const rows = ['সদস্য শিক্ষা শিবির', 'সদস্য শিক্ষা বৈঠক', 'সদস্য শবেবরাতী', 'সদস্যদের পরীক্ষা', 'উপশাখা দায়িত্বশীল টিসি', 'সাথী শিক্ষাশিবির', 'সাথী শিক্ষা বৈঠক', 'সাথী শবেবরাতী', 'সাথীদের পরীক্ষা', 'কর্মী শিক্ষাশিবির', 'কর্মী টি.এস', 'কর্মী শবেবরাতী', 'কর্মীদের পরীক্ষা', 'কুরআন তালিম', 'সামষ্টিক পাঠ', 'সমর্থক শিক্ষা বৈঠক', 'অন্যান্য'];
    let o = 1;
    for (const r of rows) {
      for (const k of ['count', 'attendance', 'avg']) {
        await field({ templateId: T0, sectionId: s.id, key: `p3.training.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P3-1 বিষয় ----------
  {
    const s = await section(T0, 'p3.subject', 'বিষয়', 12);
    const rows = ['আয়াত হাদিস মুখস্থ করণ', 'বই পাঠ প্রতিযোগিতা', 'সীরাত পাঠ প্রতিযোগিতা', 'মনীষীদের জীবনী পাঠ'];
    let o = 1;
    for (const r of rows) {
      for (const k of ['count', 'extra', 'total', 'avg']) {
        await field({ templateId: T0, sectionId: s.id, key: `subject.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P3-1 ক্লাস ----------
  {
    const s = await section(T0, 'p3.class', 'ক্লাস', 13);
    const rows = ['সদস্য স্টাডি ক্লাস', 'সদস্য কুরআন স্টাডি ক্লাস', 'সাথী কুরআন ক্লাস'];
    let o = 1;
    for (const r of rows) {
      for (const k of ['groupCount', 'programCount', 'attendance', 'avg']) {
        await field({ templateId: T0, sectionId: s.id, key: `class.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P3-1 আলোচনা চক্র ----------
  {
    const s = await section(T0, 'p3.chorcha', 'আলোচনা চক্র', 14);
    const rows = ['সাথী আলোচনা চক্র', 'কর্মী আলোচনা চক্র'];
    const subs = ['শাখায়', 'অঞ্চলে', 'থানায়', 'ওয়ার্ডে'];
    let o = 1;
    for (const r of rows) {
      for (const sub of subs) {
        for (const k of ['count', 'attendance', 'avg']) {
          await field({ templateId: T0, sectionId: s.id, key: `chorcha.${r}.${sub}.${k}`, labelBn: `${r} — ${sub} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
        }
      }
    }
  }

  // ---------- P3-2 পাঠচক্র ----------
  {
    const s = await section(T0, 'p3.pathchakra', 'পাঠচক্র', 15);
    const rows = ['সদস্য প্রার্থী', 'সাথী'];
    let o = 1;
    for (const r of rows) {
      for (const k of ['groupCount', 'delegateCount', 'applicationCount', 'attendance', 'avg']) {
        await field({ templateId: T0, sectionId: s.id, key: `pathchakra.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P3-3 ওয়ার্কশপ ----------
  {
    const s = await section(T0, 'p3.workshop', 'ওয়ার্কশপ', 16);
    const rows = ['সদস্য প্রার্থী', 'সাথী', 'সাথী প্রার্থী', 'কর্মী'];
    let o = 1;
    for (const r of rows) {
      for (const k of ['count', 'attendance', 'avg']) {
        await field({ templateId: T0, sectionId: s.id, key: `workshop.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P3-4 পাঠাগার ----------
  {
    const s = await section(T0, 'p3.library', 'পাঠাগার', 17);
    const rows = ['সংখ্যা', 'বই সংখ্যা', 'ব্যক্তিগত পাঠাগার'];
    let o = 1;
    for (const r of rows) {
      for (const k of ['prev', 'current', 'growth', 'deficit']) {
        await field({ templateId: T0, sectionId: s.id, key: `library.${r}.${k}`, labelBn: `${r} — ${k}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P3-4 জনশক্তি পাঠ কার্যক্রম ----------
  {
    const s = await section(T0, 'p3.readers', 'জনশক্তি পাঠ কার্যক্রম', 18);
    const rows = ['পাঠক', 'ইস্যুকৃত বই', 'পঠিত বই', 'অনলাইনে পাঠক', 'অনলাইনে পঠিত বই', 'অনলাইনে প্রেরিত বই', 'অনলাইনে আপলোড'];
    let o = 1;
    for (const r of rows) {
      await field({ templateId: T0, sectionId: s.id, key: `readers.${r}`, labelBn: r, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
    }
  }

  // ---------- P3-5 যোগাযোগ ----------
  {
    const s = await section(T0, 'p3.contact', 'যোগাযোগ', 19);
    const rows = ['চিঠি/সার্কুলার', 'ই-মেইল'];
    const cols = ['মোট', 'কেন্দ্র থেকে প্রাপ্ত', 'শাখা থেকে প্রকাশিত', 'অঞ্চল সংগঠনে প্রেরিত', 'কেন্দ্রে প্রেরিত', 'সংগঠনের বাইরে থেকে প্রাপ্ত'];
    let o = 1;
    for (const r of rows) {
      for (const c of cols) {
        await field({ templateId: T0, sectionId: s.id, key: `contact.${r}.${c}`, labelBn: `${r} — ${c}`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      }
    }
  }

  // ---------- P3-6 উপকরণ ----------
  {
    const s = await section(T0, 'p3.equipment', 'উপকরণ', 20);
    const rows = ['পোস্টার — কেন্দ্র', 'পোস্টার — শাখা', 'লিফলেট — কেন্দ্র', 'লিফলেট — শাখা', 'দাওয়াতী ব্যানার', 'দেয়ালিকা/বুকলেট'];
    let o = 1;
    for (const r of rows) {
      await field({ templateId: T0, sectionId: s.id, key: `equip.${r}.qty`, labelBn: `${r} — সংখ্যা`, fieldType: N, order: o++, aggregationRule: 'ADDITIVE' });
      await field({ templateId: T0, sectionId: s.id, key: `equip.${r}.subject`, labelBn: `${r} — বিষয়`, fieldType: T, order: o++, aggregationRule: 'TEXT_JOIN' });
    }
  }

  // ---------- P3-7 স্বাক্ষর ----------
  {
    const s = await section(T0, 'p3.signatures', 'স্বাক্ষর', 21);
    await field({ templateId: T0, sectionId: s.id, key: 'signature.secretary', labelBn: 'সেক্রেটারীর স্বাক্ষর', fieldType: T, order: 1, isReadOnly: true });
    await field({ templateId: T0, sectionId: s.id, key: 'signature.president', labelBn: 'সভাপতির স্বাক্ষর', fieldType: T, order: 2, isReadOnly: true });
  }

  // ---------- P4 কর্মী বৃদ্ধি তালিকা ----------
  {
    const s = await section(T0, 'p4.employeeGrowth', 'কর্মী বৃদ্ধি তালিকা : মানোন্নয়ন', 22);
    const columns = [
      'ক্রম', 'নাম', 'থানা কোড', 'শিক্ষাপ্রতিষ্ঠানের ধরন — ক্যাটাগরি', 'শিক্ষাপ্রতিষ্ঠানের ধরন — সাব-ক্যাটাগরি',
      'শ্রেণি/বর্ষ', 'বিষয়/বিভাগ', 'দায়িত্ব', 'কর্মী হওয়ার তারিখ',
      'পেশাগত টার্গেট — সেক্টর', 'পেশাগত টার্গেট — সাব-সেক্টর', 'রক্তগ্রুপ', 'নিজ জেলা', 'উপজেলা',
    ];
    await field({
      templateId: T0, sectionId: s.id, key: 'employeeGrowth.table', labelBn: 'কর্মী বৃদ্ধি তালিকা', fieldType: 'TABLE_ROWS', order: 1,
      layoutMeta: {
        columns,
        columnTypes: ['number', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'date', 'text', 'text', 'text', 'text', 'text'],
        minRows: 2,
      },
    });
  }
}