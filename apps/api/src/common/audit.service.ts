// apps/api/src/common/audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(data: {
    actorId?: string;
    action: AuditAction;
    entity: string;
    entityId?: string;
    meta?: any;
    ip?: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }
}