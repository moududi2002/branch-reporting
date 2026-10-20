// apps/api/src/reports/form.controller.ts
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { FormService } from './form.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller('reports')
export class FormController {
  constructor(private readonly form: FormService) {}

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'THANA_ADMIN', 'VIEWER')
  @Get(':id/form')
  getForm(@Param('id') id: string, @Req() req: any) {
    return this.form.getForm(id, req.user);
  }
}