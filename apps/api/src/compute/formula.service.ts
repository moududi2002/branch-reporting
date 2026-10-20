// apps/api/src/compute/formula.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculationRule } from '@prisma/client';

/**
 * Evaluates calculationRule for all fields of a report.
 * Supports: NONE, DIFFERENCE, ADDITIVE, FORMULA (minimal expression evaluator).
 * Formula syntax: field keys (dot-notation) and basic operators + - * / ( ).
 * Function helpers: sum(prefix.*), count(prefix.*).
 */
@Injectable()
export class FormulaService {
  constructor(private readonly prisma: PrismaService) {}

  async computeForReport(reportId: string): Promise<Record<string, number | null>> {
    const report = await this.prisma.report.findUniqueOrThrow({
      where: { id: reportId },
      include: { values: true, template: { include: { fields: true } } },
    });

    const keyToId = new Map(report.template.fields.map((f) => [f.key, f.id]));
    const idToField = new Map(report.template.fields.map((f) => [f.id, f]));
    const values: Record<string, number | null> = {};
    for (const v of report.values) values[v.fieldId] = v.valueNum != null ? Number(v.valueNum) : null;

    // topological-ish: compute in order, iterating a few times so dependencies resolve
    for (let pass = 0; pass < 3; pass++) {
      for (const f of report.template.fields) {
        if (f.calculationRule === CalculationRule.NONE) continue;
        const result = this.evaluate(f, report.template.fields, values, keyToId, idToField);
        if (result !== undefined) values[f.id] = result;
      }
    }
    return values;
  }

  private evaluate(
    field: { id: string; key: string; calculationRule: CalculationRule; formula: string | null },
    allFields: any[],
    values: Record<string, number | null>,
    keyToId: Map<string, string>,
    idToField: Map<string, any>,
  ): number | null | undefined {
    const rule = field.calculationRule;

    if (rule === CalculationRule.DIFFERENCE) {
      // Support formulas like "target-current", or infer via suffix pairs.
      if (field.formula) return this.evalExpression(field.formula, values, keyToId);
      return undefined;
    }

    if (rule === CalculationRule.ADDITIVE) {
      // Sum of same-prefix numeric fields with the same suffix pattern
      const parts = field.key.split('.');
      const prefix = parts.slice(0, -1).join('.');
      let sum = 0;
      let found = false;
      for (const [k, id] of keyToId) {
        if (k !== field.key && k.startsWith(prefix + '.')) {
          const v = values[id];
          if (typeof v === 'number') {
            sum += v;
            found = true;
          }
        }
      }
      return found ? sum : null;
    }

    if (rule === CalculationRule.FORMULA && field.formula) {
      return this.evalExpression(field.formula, values, keyToId);
    }
    return undefined;
  }

  /** Minimal safe evaluator (no eval). Supports numbers, dot keys, + - * / ( ), sum(prefix.*), count(prefix.*). */
  private evalExpression(expr: string, values: Record<string, number | null>, keyToId: Map<string, string>): number | null {
    // Convert dot-keys to identifiers
    let js = expr;
    // sum(prefix.*) → helper
    js = js.replace(/sum\(([a-zA-Z0-9_.]+)\.\*\)/g, (_m, prefix) => {
      let s = 0;
      for (const [k, id] of keyToId) {
        if (k.startsWith(prefix + '.')) {
          const v = values[id];
          if (typeof v === 'number') s += v;
        }
      }
      return String(s);
    });
    js = js.replace(/count\(([a-zA-Z0-9_.]+)\.\*\)/g, (_m, prefix) => {
      let c = 0;
      for (const [k] of keyToId) if (k.startsWith(prefix + '.')) c++;
      return String(c);
    });
    // Replace field keys with their numeric values
    for (const [k, id] of keyToId) {
      const v = values[id];
      const safe = v != null ? String(v) : '0';
      js = js.replace(new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), safe);
    }
    // Strip anything not allowed
    if (!/^[0-9+\-*/().\s]+$/.test(js)) return null;
    try {
      // eslint-disable-next-line no-new-func
      const out = Function(`"use strict"; return (${js});`)();
      return typeof out === 'number' && isFinite(out) ? out : null;
    } catch {
      return null;
    }
  }
}