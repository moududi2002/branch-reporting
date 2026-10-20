// apps/api/src/aggregation/rules.spec.ts
import { aggregateField, FieldDef, ThanaValues } from './rules';

const field = (rule: FieldDef['aggregationRule']): FieldDef => ({
  id: 'f1',
  key: 'test',
  labelBn: 'টেস্ট',
  aggregationRule: rule,
  fieldType: 'NUMBER',
});

const thanas = (values: Array<{ id: string; status: any; num: number | null }>): ThanaValues[] =>
  values.map((v) => ({
    thanaId: v.id,
    thanaName: v.id,
    status: v.status,
    values: { f1: { num: v.num, text: null } },
  }));

describe('aggregateField', () => {
  it('ADDITIVE sums approved only and excludes pending', () => {
    const r = aggregateField(field('ADDITIVE'), thanas([
      { id: 't1', status: 'APPROVED', num: 10 },
      { id: 't2', status: 'APPROVED', num: 20 },
      { id: 't3', status: 'PENDING', num: 100 },
    ]));
    expect(r.num).toBe(30);
    expect(r.excludedThanas).toEqual(['t3']);
  });

  it('SNAPSHOT_LAST returns the last approved', () => {
    const r = aggregateField(field('SNAPSHOT_LAST'), thanas([
      { id: 't1', status: 'APPROVED', num: 5 },
      { id: 't2', status: 'APPROVED', num: 9 },
    ]));
    expect(r.num).toBe(9);
  });

  it('WEIGHTED_AVERAGE averages approved', () => {
    const r = aggregateField(field('WEIGHTED_AVERAGE'), thanas([
      { id: 't1', status: 'APPROVED', num: 10 },
      { id: 't2', status: 'APPROVED', num: 30 },
    ]));
    expect(r.num).toBe(20);
  });

  it('TEXT_JOIN joins approved text', () => {
    const f = { ...field('TEXT_JOIN'), fieldType: 'TEXT' };
    const r = aggregateField(f, [
      { thanaId: 't1', thanaName: 't1', status: 'APPROVED', values: { f1: { num: null, text: 'ক' } } },
      { thanaId: 't2', thanaName: 't2', status: 'APPROVED', values: { f1: { num: null, text: 'খ' } } },
    ]);
    expect(r.text).toBe('ক\n---\nখ');
  });

  it('does not silently treat missing as 0', () => {
    const r = aggregateField(field('ADDITIVE'), thanas([
      { id: 't1', status: 'MISSING', num: null },
    ]));
    expect(r.num).toBe(0);
    expect(r.excludedThanas).toEqual(['t1']);
  });
});