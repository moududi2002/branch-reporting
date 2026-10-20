// apps/api/src/aggregation/aggregation.module.ts
import { Module } from '@nestjs/common';
import { AggregationController } from './aggregation.controller';
import { AggregationService } from './aggregation.service';
import { DashboardController } from './dashboard.controller';

@Module({
  controllers: [AggregationController, DashboardController],
  providers: [AggregationService],
  exports: [AggregationService],
})
export class AggregationModule {}