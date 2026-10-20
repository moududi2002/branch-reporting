// apps/api/src/imports/imports.module.ts
import { Module } from '@nestjs/common';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  controllers: [ImportsController],
  providers: [ImportsService],
})
export class ImportsModule {}