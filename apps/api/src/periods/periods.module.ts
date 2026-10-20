// apps/api/src/periods/periods.module.ts
import { Module } from '@nestjs/common';
import { PeriodsController } from './periods.controller';
import { PeriodsService } from './periods.service';
import { SessionsService } from './sessions.service';

@Module({
  controllers: [PeriodsController],
  providers: [PeriodsService, SessionsService],
  exports: [PeriodsService, SessionsService],
})
export class PeriodsModule {}