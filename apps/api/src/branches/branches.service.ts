// apps/api/src/branches/branches.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.branch.findMany({ orderBy: { name: 'asc' } });
  }

  create(data: { name: string; code: string }) {
    return this.prisma.branch.create({ data });
  }

  async rename(id: string, name: string) {
    // snapshot old name first
    const existing = await this.prisma.branch.findUniqueOrThrow({ where: { id } });
    await this.prisma.branchNameSnapshot.create({ data: { branchId: id, name: existing.name } });
    return this.prisma.branch.update({ where: { id }, data: { name } });
  }
}