// apps/api/src/compute/financial-totals.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinancialTotalsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Compute totals on demand; write back into report_values for approved snapshots. */
  async compute(reportId: string) {
    const report = await this.prisma.report.findUniqueOrThrow({ where: { id: reportId }, include: { values: true, template: { include: { fields: true } } } });
    const keyToId = new Map(report.template.fields.map((f) => [f.key, f.id]));
    const val = (k: string) => {
      const id = keyToId.get(k);
      if (!id) return 0;
      const v = report.values.find((x) => x.fieldId === id);
      return v?.valueNum ? Number(v.valueNum) : 0;
    };
    const set = (k: string, n: number) => {
      const id = keyToId.get(k);
      if (!id) return;
      return this.prisma.reportValue.upsert({
        where: { reportId_fieldId: { reportId, fieldId: id } },
        update: { valueNum: n },
        create: { reportId, fieldId: id, valueNum: n },
      });
    };

    const incomeKeys = report.template.fields
      .filter((f) => f.key.startsWith('fin.income.') && f.key.endsWith('.received'))
      .map((f) => f.key);
    const expenseKeys = report.template.fields
      .filter((f) => f.key.startsWith('fin.expense.') && f.key.endsWith('.amount'))
      .map((f) => f.key);

    const income = incomeKeys.reduce((s, k) => s + val(k), 0);
    const expense = expenseKeys.reduce((s, k) => s + val(k), 0);
    const prevSurplus = val('fin.total.prevSurplus');

    await Promise.all([
      set('fin.total.monthIncome', income),
      set('fin.total.monthExpense', expense),
      set('fin.total.grandIncome', income + prevSurplus),
      set('fin.total.grandExpense', expense),
      set('fin.total.surplus', income - expense),
    ]);
  }
}