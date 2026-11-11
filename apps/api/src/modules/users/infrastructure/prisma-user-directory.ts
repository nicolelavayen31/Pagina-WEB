import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/persistence/prisma.service';
import type { UserDirectory } from '../application/ports/user-directory';

@Injectable()
export class PrismaUserDirectory implements UserDirectory {
  constructor(private readonly prisma: PrismaService) {}

  async isActive(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({ where: { id: userId, isActive: true }, select: { id: true } });
    return user !== null;
  }
}
