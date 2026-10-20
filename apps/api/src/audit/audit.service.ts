// apps/api/src/audit/audit.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(limit = 100) {
    const safeLimit = Math.min(
      500,
      Math.max(1, Math.floor(limit)),
    );

    return this.prisma.auditLog.findMany({
      take: safeLimit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
