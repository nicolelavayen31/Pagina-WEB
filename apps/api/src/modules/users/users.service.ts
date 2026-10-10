import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import type { RoleName } from '@repo/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';

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

function present(user: UserRow) {
  const { roles, ...rest } = user;
  return { ...rest, roles: roles.map((entry) => entry.role.name) };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
  ) {}

  async list() {
    const users = await this.prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'asc' } });
    return users.map(present);
  }

  async create(input: { email: string; name: string; password: string; roles: RoleName[] }, actorId: string) {
    const roleIds = await this.roleIds(input.roles);
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        name: input.name,
        passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }),
        roles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
      select: userSelect,
    });
    await this.audit.log(actorId, 'user.created', 'User', user.id, { roles: input.roles });
    return present(user);
  }

  async update(id: string, input: { name?: string; isActive?: boolean; roles?: RoleName[] }, actorId: string) {
    const existing = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (id === actorId && (input.isActive === false || (input.roles && !input.roles.includes('ADMIN')))) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'No puede desactivarse ni quitarse el rol ADMIN a sí mismo',
      });
    }

    const roleIds = input.roles ? await this.roleIds(input.roles) : null;
    const user = await this.prisma.$transaction(async (tx) => {
      if (roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({ data: roleIds.map((roleId) => ({ userId: id, roleId })) });
      }
      return tx.user.update({
        where: { id },
        data: { name: input.name, isActive: input.isActive },
        select: userSelect,
      });
    });

    if (input.isActive === false) {
      await this.auth.revokeAllSessionsForUser(id);
    }
    await this.audit.log(actorId, 'user.updated', 'User', id, { fields: Object.keys(input) });
    return present(user);
  }

  private async roleIds(names: RoleName[]) {
    const roles = await this.prisma.role.findMany({ where: { name: { in: names } }, select: { id: true } });
    if (roles.length !== new Set(names).size) {
      throw new BadRequestException({ statusCode: 400, message: 'Rol desconocido' });
    }
    return roles.map((role) => role.id);
  }
}
