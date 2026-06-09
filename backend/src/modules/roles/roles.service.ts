import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';

import { resolveOrderBy, SortableMap } from '../../common/db/sortable';
import {
  buildPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from '../../common/dto/pagination.dto';
import { DRIZZLE, type Database } from '../../database/database.module';
import { roles, teamMembers } from '../../database/schema';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

type Role = typeof roles.$inferSelect;

const SORTABLE: SortableMap = {
  name: roles.name,
  createdAt: roles.createdAt,
  updatedAt: roles.updatedAt,
};

@Injectable()
export class RolesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(orgId: string, dto: CreateRoleDto): Promise<Role> {
    const existing = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.organizationId, orgId), eq(roles.name, dto.name)))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(
        `Role "${dto.name}" already exists in this organization`,
      );
    }

    const [role] = await this.db
      .insert(roles)
      .values({ ...dto, organizationId: orgId })
      .returning();
    return role;
  }

  async findAll(
    orgId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Role>> {
    const { page, limit, sort, order } = pagination;
    const where = eq(roles.organizationId, orgId);
    const orderBy = resolveOrderBy(SORTABLE, sort, order, roles.createdAt);

    const [data, totalRows] = await Promise.all([
      this.db
        .select()
        .from(roles)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ value: count() }).from(roles).where(where),
    ]);

    return buildPaginatedResult(data, totalRows[0]?.value ?? 0, page, limit);
  }

  async findOne(orgId: string, id: string): Promise<Role> {
    const rows = await this.db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), eq(roles.organizationId, orgId)))
      .limit(1);
    const role = rows.at(0);

    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    return role;
  }

  async update(orgId: string, id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(orgId, id);

    if (dto.name && role.isDefault) {
      throw new ConflictException(
        `Role "${role.name}" is a default role and cannot be renamed`,
      );
    }

    if (dto.name) {
      const existing = await this.db
        .select({ id: roles.id })
        .from(roles)
        .where(and(eq(roles.organizationId, orgId), eq(roles.name, dto.name)))
        .limit(1);
      const conflicting = existing.at(0);
      if (conflicting && conflicting.id !== id) {
        throw new ConflictException(
          `Role "${dto.name}" already exists in this organization`,
        );
      }
    }

    const [updated] = await this.db
      .update(roles)
      .set(dto)
      .where(and(eq(roles.id, id), eq(roles.organizationId, orgId)))
      .returning();
    return updated;
  }

  async remove(orgId: string, id: string): Promise<void> {
    const role = await this.findOne(orgId, id);

    if (role.isDefault) {
      throw new ConflictException(
        `Role "${role.name}" is a default role and cannot be deleted`,
      );
    }

    const usage = await this.db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(eq(teamMembers.roleId, id))
      .limit(1);

    if (usage.length > 0) {
      throw new ConflictException(
        `Role ${id} is assigned to one or more team members and cannot be deleted`,
      );
    }

    await this.db
      .delete(roles)
      .where(and(eq(roles.id, id), eq(roles.organizationId, orgId)));
  }
}
