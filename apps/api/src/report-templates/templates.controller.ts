// apps/api/src/report-templates/templates.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller()
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'THANA_ADMIN', 'VIEWER')
  @Get('report-types')
  listTypes() {
    return this.templates.listTypes();
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'VIEWER')
  @Get('report-templates')
  listTemplates(@Query('reportTypeId') reportTypeId?: string) {
    return this.templates.listTemplates(reportTypeId);
  }

  @Roles('SUPER_ADMIN')
  @Post('report-templates')
  createTemplate(@Body() body: { reportTypeId: string; nameBn: string; version?: number }) {
    return this.templates.createTemplate(body);
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'THANA_ADMIN', 'VIEWER')
  @Get('report-templates/:id')
  getTree(@Param('id') id: string) {
    return this.templates.getTemplateTree(id);
  }

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'THANA_ADMIN', 'VIEWER')
  @Get('report-types/:reportTypeId/active-template')
  active(@Param('reportTypeId') reportTypeId: string) {
    return this.templates.getActiveTemplate(reportTypeId);
  }

  @Roles('SUPER_ADMIN')
  @Post('report-templates/:templateId/sections')
  createSection(@Param('templateId') templateId: string, @Body() body: any) {
    return this.templates.createSection({ reportTemplateId: templateId, ...body });
  }

  @Roles('SUPER_ADMIN')
  @Post('report-templates/:templateId/fields')
  createField(@Param('templateId') templateId: string, @Body() body: any) {
    return this.templates.createField({ reportTemplateId: templateId, ...body });
  }

  @Roles('SUPER_ADMIN')
  @Patch('report-fields/:id')
  updateField(@Param('id') id: string, @Body() body: any) {
    return this.templates.updateField(id, body);
  }

  @Roles('SUPER_ADMIN')
  @Delete('report-fields/:id')
  deleteField(@Param('id') id: string) {
    return this.templates.deleteField(id);
  }
}