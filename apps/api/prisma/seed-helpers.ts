// apps/api/prisma/seed-helpers.ts
import { PrismaClient, FieldType, CalculationRule, AggregationRule } from '@prisma/client';
export const prisma = new PrismaClient();

export async function section(
  templateId: string,
  key: string,
  titleBn: string,
  order: number,
  layoutMeta?: any,
) {
  return prisma.reportSection.upsert({
    where: { reportTemplateId_key: { reportTemplateId: templateId, key } },
    update: { titleBn, order, layoutMeta: layoutMeta ?? null },
    create: { reportTemplateId: templateId, key, titleBn, order, layoutMeta: layoutMeta ?? null },
  });
}

export async function field(data: {
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
  formula?: string;
}) {
  return prisma.reportField.upsert({
    where: { reportTemplateId_key: { reportTemplateId: data.templateId, key: data.key } },
    update: {
      labelBn: data.labelBn,
      fieldType: data.fieldType,
      order: data.order,
      isReadOnly: data.isReadOnly ?? false,
      isRequired: data.isRequired ?? false,
      calculationRule: data.calculationRule ?? CalculationRule.NONE,
      aggregationRule: data.aggregationRule ?? AggregationRule.NONE,
      options: data.options ?? null,
      layoutMeta: data.layoutMeta ?? null,
      sectionId: data.sectionId ?? null,
      formula: data.formula ?? null,
    },
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
      formula: data.formula,
    },
  });
}