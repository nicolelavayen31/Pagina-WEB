import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/persistence/prisma.service';
import type { UserAccount, UserAccountRepository } from '../application/ports/user-account.repository';
import { toAuthenticatedUser, userWithPermissionsInclude } from './user-permissions.mapper';

@Injectable()
export class PrismaUserAccountRepository implements UserAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserAccount | null> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: userWithPermissionsInclude,
    });
    if (!user) {
      return null;
    }
    return { ...toAuthenticatedUser(user), passwordHash: user.passwordHash, isActive: user.isActive };
  }

  async recordLogin(userId: string, at: Date): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: at } });
  }
}
