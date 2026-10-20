// apps/api/src/reports/progress.controller.ts
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('reports/:id')
export class ProgressController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('progress')
  async progress(@Param('id') id: string) {
    const report = await this.prisma.report.findUniqueOrThrow({ where: { id }, include: { template: { include: { sections: true, fields: true } }, values: true } });
    const bySection = report.template.sections.map((s) => {
      const fields = report.template.fields.filter((f) => f.sectionId === s.id);
      const filled = fields.filter((f) => report.values.some((v) => v.fieldId === f.id && (v.valueNum != null || v.valueText))).length;
      return { id: s.id, titleBn: s.titleBn, filled, total: fields.length };
    });
    return { bySection };
  }
}