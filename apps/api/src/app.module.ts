// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches.module';
import { ThanasModule } from './thanas/thanas.module';
import { TemplatesModule } from './report-templates/templates.module';
import { ReportsModule } from './reports/reports.module';
import { PeriodsModule } from './periods/periods.module';
import { WorkflowModule } from './workflow/workflow.module';
import { AggregationModule } from './aggregation/aggregation.module';
import { UsersModule } from './users/users.module';
import { ImportsModule } from './imports/imports.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule, AuthModule, BranchesModule, ThanasModule, TemplatesModule,
    ReportsModule, PeriodsModule, WorkflowModule, AggregationModule,
    UsersModule, ImportsModule,AuditModule,
  ],
})
export class AppModule {}