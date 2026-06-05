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
import { members } from '../../database/schema';

import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

type Member = typeof members.$inferSelect;

const SORTABLE: SortableMap = {
  email: members.email,
  fullName: members.fullName,
  createdAt: members.createdAt,
  updatedAt: members.updatedAt,
};

@Injectable()
export class MembersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(orgId: string, dto: CreateMemberDto): Promise<Member> {
    const existing = await this.db
      .select({ id: members.id })
      .from(members)
      .where(
        and(eq(members.organizationId, orgId), eq(members.email, dto.email)),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(
        `Member with email ${dto.email} already exists in this organization`,
      );
    }

    const [member] = await this.db
      .insert(members)
      .values({
        organizationId: orgId,
        email: dto.email,
        fullName: dto.fullName,
        userId: dto.userId,
      })
      .returning();
    return member;
  }

  async findAll(
    orgId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Member>> {
    const { page, limit, sort, order } = pagination;
    const where = and(
      eq(members.organizationId, orgId),
      eq(members.isActive, true),
    );

    const orderBy = resolveOrderBy(SORTABLE, sort, order, members.createdAt);

    const [data, totalRows] = await Promise.all([
      this.db
        .select()
        .from(members)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ value: count() }).from(members).where(where),
    ]);

    return buildPaginatedResult(data, totalRows[0]?.value ?? 0, page, limit);
  }

  async findOne(orgId: string, id: string): Promise<Member> {
    const rows = await this.db
      .select()
      .from(members)
      .where(and(eq(members.id, id), eq(members.organizationId, orgId)))
      .limit(1);
    const member = rows.at(0);

    if (!member) {
      throw new NotFoundException(`Member ${id} not found`);
    }
    return member;
  }

  async update(
    orgId: string,
    id: string,
    dto: UpdateMemberDto,
  ): Promise<Member> {
    await this.findOne(orgId, id);

    const [updated] = await this.db
      .update(members)
      .set(dto)
      .where(and(eq(members.id, id), eq(members.organizationId, orgId)))
      .returning();

    return updated;
  }

  async softDelete(orgId: string, id: string): Promise<Member> {
    await this.findOne(orgId, id);

    const [deleted] = await this.db
      .update(members)
      .set({ isActive: false })
      .where(and(eq(members.id, id), eq(members.organizationId, orgId)))
      .returning();

    return deleted;
  }
}
