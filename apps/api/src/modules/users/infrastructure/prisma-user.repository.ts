import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/persistence/prisma.service';
import type { NewUser, UserChanges, UserRepository, UserView } from '../application/ports/user.repository';

const userSelect = {
  id: true,
  email: true,
  name: true,
  isActive: true,
  createdAt: true,
  lastLoginAt: true,
  roles: { select: { role: { select: { name: true } } } },
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;

function toView({ roles, ...user }: UserRow): UserView {
  return { ...user, roles: roles.map((entry) => entry.role.name) };
}

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<UserView[]> {
    const users = await this.prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'asc' } });
    return users.map(toView);
  }

  async exists(id: string): Promise<boolean> {
    return (await this.prisma.user.findUnique({ where: { id }, select: { id: true } })) !== null;
  }

  async findRoleIds(names: readonly string[]): Promise<string[]> {
    const roles = await this.prisma.role.findMany({ where: { name: { in: [...names] } }, select: { id: true } });
    return roles.map((role) => role.id);
  }

  async create({ roleIds, ...user }: NewUser): Promise<UserView> {
    const created = await this.prisma.user.create({
      data: { ...user, roles: { create: roleIds.map((roleId) => ({ roleId })) } },
      select: userSelect,
    });
    return toView(created);
  }

  async update(id: string, { roleIds, ...changes }: UserChanges): Promise<UserView> {
    const updated = await this.prisma.$transaction(async (tx) => {
      if (roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({ data: roleIds.map((roleId) => ({ userId: id, roleId })) });
      }
      return tx.user.update({ where: { id }, data: changes, select: userSelect });
    });
    return toView(updated);
  }
}
