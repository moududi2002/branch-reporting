// apps/api/src/aggregation/aggregation.controller.ts
import { Controller, Get, Param, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { AggregationService, AggregateScope } from './aggregation.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Controller()
export class AggregationController {
  constructor(private readonly agg: AggregationService) {}

  @Roles('SUPER_ADMIN', 'BRANCH_ADMIN', 'VIEWER')
  @Get('branches/:branchId/aggregates')
  async branchAggregate(
    @Param('branchId') branchId: string,
    @Query('reportTypeId') reportTypeId: string,
    @Query('scope') scope: AggregateScope,
    @Query('at') at: string | undefined,
    @Req() req: any,
  ) {
    if (!reportTypeId) throw new BadRequestException('reportTypeId required');
    if (!['monthly', 'semi-annual', 'annual'].includes(scope)) {
      throw new BadRequestException('scope must be monthly|semi-annual|annual');
    }
    const atDate = at ? new Date(at) : new Date();
    const { from, to } = this.agg.windowFor(scope, atDate);
    return this.agg.branchAggregate({
      branchId,
      reportTypeId,
      from,
      to,
      scope,
      user: req.user,
    });
  }
}