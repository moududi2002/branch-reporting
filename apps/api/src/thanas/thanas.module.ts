// apps/api/src/thanas/thanas.module.ts
import { Module } from '@nestjs/common';
import { ThanasController } from './thanas.controller';
import { ThanasService } from './thanas.service';

@Module({
  controllers: [ThanasController],
  providers: [ThanasService],
})
export class ThanasModule {}