// apps/api/src/users/users.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
    const isSuperAdmin = user.role === Role.SUPER_ADMIN;
    const isBranchAdmin = user.role === Role.BRANCH_ADMIN;

    if (!isSuperAdmin && !isBranchAdmin) {
      throw new ForbiddenException();
    }

    // Branch Admin শুধু নিজের branch-এ
    // THANA_ADMIN ও VIEWER তৈরি করতে পারবে।
    if (isBranchAdmin) {
      if (
        data.role !== Role.THANA_ADMIN &&
        data.role !== Role.VIEWER
      ) {
        throw new ForbiddenException(
          'Branch Admin can only create THANA_ADMIN or VIEWER',
        );
      }

      if (!user.branchId || data.branchId !== user.branchId) {
        throw new ForbiddenException(
          'Branch Admin can only create users in their own branch',
        );
      }
    }

    if (
      data.role !== Role.SUPER_ADMIN &&
      !data.branchId
    ) {
      throw new BadRequestException('branchId required');
    }

    if (data.role === Role.THANA_ADMIN && !data.thanaId) {
      throw new BadRequestException('thanaId required for THANA_ADMIN');
    }

    if (data.role !== Role.THANA_ADMIN && data.thanaId) {
      throw new BadRequestException(
        'thanaId is only allowed for THANA_ADMIN',
      );
    }

    if (data.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: data.branchId },
        select: { id: true },
      });

      if (!branch) {
        throw new BadRequestException('Invalid branchId');
      }
    }

    if (data.role === Role.THANA_ADMIN) {
      const thana = await this.prisma.thana.findUnique({
        where: { id: data.thanaId },
        select: { id: true, branchId: true },
      });

      if (!thana || thana.branchId !== data.branchId) {
        throw new BadRequestException(
          'Selected thana does not belong to the selected branch',
        );
      }
    }

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

  private async assertCanManageUser(actor: any, targetId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, branchId: true },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (actor.role === Role.SUPER_ADMIN) {
      return;
    }

    if (actor.role !== Role.BRANCH_ADMIN) {
      throw new ForbiddenException();
    }

    if (
      target.id === actor.id ||
      target.role === Role.SUPER_ADMIN ||
      target.branchId !== actor.branchId
    ) {
      throw new ForbiddenException(
        'You can only manage other users in your own branch',
      );
    }
  }

  async deactivate(user: any, id: string) {
    await this.assertCanManageUser(user, id);
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'BRANCH_ADMIN') throw new ForbiddenException();
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  async resetPassword(user: any, id: string, newPassword: string) {
    await this.assertCanManageUser(user, id);
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'BRANCH_ADMIN') throw new ForbiddenException();
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }
}