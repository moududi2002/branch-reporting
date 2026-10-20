// apps/api/src/auth/session-cleanup.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class SessionCleanupService {
  constructor(private readonly prisma: PrismaService) {}
  @Cron(CronExpression.EVERY_HOUR)
  async clean() {
    await this.prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }
}