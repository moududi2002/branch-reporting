// apps/api/src/report-templates/templates.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FieldType, CalculationRule, AggregationRule } from '@prisma/client';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  listTypes() {
    return this.prisma.reportType.findMany({ orderBy: { code: 'asc' } });
  }

  listTemplates(reportTypeId?: string) {
    return this.prisma.reportTemplate.findMany({
      where: reportTypeId ? { reportTypeId } : undefined,
      include: { reportType: true },
      orderBy: [{ reportTypeId: 'asc' }, { version: 'desc' }],
    });
  }

  async createTemplate(data: { reportTypeId: string; nameBn: string; version?: number }) {
    const last = await this.prisma.reportTemplate.findFirst({
      where: { reportTypeId: data.reportTypeId },
      orderBy: { version: 'desc' },
    });
    const version = data.version ?? (last ? last.version + 1 : 1);
    return this.prisma.reportTemplate.create({
      data: { reportTypeId: data.reportTypeId, nameBn: data.nameBn, version },
    });
  }

  async getTemplateTree(templateId: string) {
    const tpl = await this.prisma.reportTemplate.findUnique({
      where: { id: templateId },
      include: {
        reportType: true,
        sections: { orderBy: { order: 'asc' } },
        fields: { orderBy: { order: 'asc' } },
      },
    });
    if (!tpl) throw new NotFoundException();
    return tpl;
  }

  async getActiveTemplate(reportTypeId: string) {
    const tpl = await this.prisma.reportTemplate.findFirst({
      where: { reportTypeId, isActive: true },
      orderBy: { version: 'desc' },
      include: {
        reportType: true,
        sections: { orderBy: { order: 'asc' } },
        fields: { orderBy: { order: 'asc' } },
      },
    });
    if (!tpl) throw new NotFoundException('No active template');
    return tpl;
  }

  createSection(data: {
    reportTemplateId: string;
    key: string;
    titleBn: string;
    order: number;
    layoutMeta?: any;
  }) {
    return this.prisma.reportSection.create({ data });
  }

  createField(data: {
    reportTemplateId: string;
    sectionId?: string;
    key: string;
    labelBn: string;
    fieldType: FieldType;
    calculationRule?: CalculationRule;
    aggregationRule?: AggregationRule;
    isReadOnly?: boolean;
    isRequired?: boolean;
    order: number;
    options?: any;
    formula?: string;
    layoutMeta?: any;
  }) {
    return this.prisma.reportField.create({ data });
  }

  updateField(id: string, data: Partial<{
    labelBn: string;
    fieldType: FieldType;
    calculationRule: CalculationRule;
    aggregationRule: AggregationRule;
    isReadOnly: boolean;
    isRequired: boolean;
    order: number;
    options: any;
    formula: string;
    layoutMeta: any;
  }>) {
    return this.prisma.reportField.update({ where: { id }, data });
  }

  deleteField(id: string) {
    return this.prisma.reportField.delete({ where: { id } });
  }
}