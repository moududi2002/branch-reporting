// apps/api/src/thanas/thanas.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThanasService {
  constructor(private readonly prisma: PrismaService) {}

  listByBranch(branchId?: string) {
    return this.prisma.thana.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  create(data: { branchId: string; name: string; code: string }) {
    return this.prisma.thana.create({ data });
  }

  async rename(id: string, name: string) {
    const existing = await this.prisma.thana.findUniqueOrThrow({ where: { id } });
    await this.prisma.thanaNameSnapshot.create({ data: { thanaId: id, name: existing.name } });
    return this.prisma.thana.update({ where: { id }, data: { name } });
  }
}