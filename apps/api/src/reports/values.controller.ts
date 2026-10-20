
// apps/api/src/reports/values.controller.ts
import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ValuesService } from './values.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FormulaService } from '../compute/formula.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('reports')
export class ValuesController {
  constructor(
    private readonly values: ValuesService,
    private readonly formula: FormulaService,
  ) {}

  @Roles('THANA_ADMIN', 'SUPER_ADMIN')
  @Post(':id/values')
  async upsert(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    const expected = req.headers['if-match']
      ? Number(req.headers['if-match'])
      : undefined;

    // Save report values
    await this.values.upsertValues(
      id,
      req.user,
      body.values,
      expected,
    );

    // Compute formula values after saving
    const computed = await this.formula.computeForReport(id);

    return { ok: true, computed };
  }

  @Roles('THANA_ADMIN', 'SUPER_ADMIN')
  @Post(':id/table-rows/:fieldId')
  upsertRows(
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.values.upsertTableRows(
      id,
      req.user,
      fieldId,
      body.rows,
    );
  }
}
