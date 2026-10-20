// apps/api/src/aggregation/rules.ts
import { AggregationRule } from '@prisma/client';

export type FieldDef = {
  id: string;
  key: string;
  labelBn: string;
  aggregationRule: AggregationRule;
  fieldType: string;
};

export type ThanaValues = {
  thanaId: string;
  thanaName: string;
  status: 'APPROVED' | 'MISSING' | 'PENDING' | 'NOT_APPROVED';
  values: Record<string, { num: number | null; text: string | null }>;
};

/**
 * Reduce a set of thana values into one aggregate value per field,
 * respecting each field's aggregationRule. Missing/Pending thana values are
 * NOT silently treated as 0 — they are excluded from sums and reported
 * separately by the caller.
 */
export function aggregateField(
  field: FieldDef,
  thanaValues: ThanaValues[],
): { num: number | null; text: string | null; excludedThanas: string[] } {
  const excludedThanas: string[] = [];
  const approved = thanaValues.filter((t) => {
    if (t.status === 'APPROVED') return true;
    excludedThanas.push(t.thanaId);
    return false;
  });

  const nums = approved
    .map((t) => t.values[field.id]?.num)
    .filter((n): n is number => typeof n === 'number' && !isNaN(n));

  const texts = approved
    .map((t) => t.values[field.id]?.text)
    .filter((t): t is string => typeof t === 'string' && t.length > 0);

  switch (field.aggregationRule) {
    case 'ADDITIVE':
      return { num: nums.reduce((a, b) => a + b, 0), text: null, excludedThanas };
    case 'SNAPSHOT_LAST':
      // Last approved snapshot by periodEnd — caller should sort thanaValues by periodEnd
      return { num: nums.length ? nums[nums.length - 1] : null, text: null, excludedThanas };

      case 'WEIGHTED_AVERAGE': {
        // value.text may hold JSON {n, d} where n=numerator, d=denominator
        let num = 0, den = 0;
        for (const t of approved) {
          const raw = t.values[field.id];
          if (!raw) continue;
          if (raw.text) {
            try {
              const j = JSON.parse(raw.text);
              num += Number(j.n ?? 0); den += Number(j.d ?? 0);
            } catch { /* ignore */ }
          } else if (typeof raw.num === 'number') {
            num += raw.num; den += 1;
          }
        }
        return { num: den > 0 ? num / den : null, text: null, excludedThanas };
      }
    
    case 'TEXT_JOIN':
      return { num: null, text: texts.join('\n---\n'), excludedThanas };
    case 'NONE':
    default:
      return { num: null, text: null, excludedThanas };
  }
  

}




