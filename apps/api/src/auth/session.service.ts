// apps/api/src/auth/session.service.ts

import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  // Session TTL configurable (default: 7 days)
  private ttl() {
    return (
      1000 *
      60 *
      60 *
      24 *
      Number(process.env.SESSION_TTL_DAYS ?? 7)
    );
  }

  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(userId: string, ip?: string, ua?: string) {
    const token = randomBytes(32).toString('hex');

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: this.hash(token),
        expiresAt: new Date(Date.now() + this.ttl()),
        ip,
        userAgent: ua,
      },
    });

    return token;
  }

  async verify(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hash(token) },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session;
  }

  async destroy(token: string) {
    await this.prisma.session.deleteMany({
      where: { tokenHash: this.hash(token) },
    });
  }
}
