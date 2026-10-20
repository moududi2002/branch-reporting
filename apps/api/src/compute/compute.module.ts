// apps/api/src/compute/compute.module.ts

import { Module } from '@nestjs/common';
import { FormulaService } from './formula.service';

@Module({
  providers: [FormulaService],
  exports: [FormulaService],
})
export class ComputeModule {}
