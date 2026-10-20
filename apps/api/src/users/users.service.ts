// apps/api/src/users/users.service.ts
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: any, branchId?: string) {
    const where: any = {};
    if (user.role === 'BRANCH_ADMIN') where.branchId = user.branchId;
    else if (user.role === 'SUPER_ADMIN') where.branchId = branchId ?? undefined;
    else throw new ForbiddenException();

    return this.prisma.user.findMany({
      where,
      select: { id: true, email: true, fullName: true, role: true, branchId: true, thanaId: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: any, data: {
    email: string;
    password: string;
    fullName: string;
    role: Role;
    branchId?: string;
    thanaId?: string;
  }) {
    // Super Admin can create any role; Branch Admin can only create THANA_ADMIN within own branch
    if (user.role === 'BRANCH_ADMIN') {
      if (data.role !== Role.THANA_ADMIN) throw new ForbiddenException('Branch admin can only create THANA_ADMIN');
      if (data.branchId !== user.branchId) throw new ForbiddenException();
    } else if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException();
    }

    if (data.role === Role.THANA_ADMIN && !data.thanaId) throw new BadRequestException('thanaId required for THANA_ADMIN');
    if (data.role === Role.BRANCH_ADMIN && !data.branchId) throw new BadRequestException('branchId required for BRANCH_ADMIN');

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
        branchId: data.branchId ?? null,
        thanaId: data.thanaId ?? null,
      },
      select: { id: true, email: true, fullName: true, role: true },
    });
  }

  async deactivate(user: any, id: string) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'BRANCH_ADMIN') throw new ForbiddenException();
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  async resetPassword(user: any, id: string, newPassword: string) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'BRANCH_ADMIN') throw new ForbiddenException();
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }
}