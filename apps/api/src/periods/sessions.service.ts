// apps/api/src/periods/sessions.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.academicSession.findMany({ orderBy: { startDate: 'desc' } });
  }

  create(data: { label: string; startDate: Date; endDate: Date }) {
    return this.prisma.academicSession.create({ data });
  }

  update(id: string, data: Partial<{ label: string; startDate: Date; endDate: Date; isActive: boolean }>) {
    return this.prisma.academicSession.update({ where: { id }, data });
  }
}