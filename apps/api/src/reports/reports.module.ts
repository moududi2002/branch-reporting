// apps/api/src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { FormController } from './form.controller';
import { FormService } from './form.service';
import { ValuesController } from './values.controller';
import { ValuesService } from './values.service';
import { ComputeModule } from '../compute/compute.module';
import { ProgressController } from './progress.controller';

@Module({
  imports: [ComputeModule],
  controllers: [FormController, ValuesController,ProgressController  ],
  providers: [FormService, ValuesService],
  exports: [FormService, ValuesService],
})
export class ReportsModule {}
