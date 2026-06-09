import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';

import { resolveOrderBy, SortableMap } from '../../common/db/sortable';
import {
  buildPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from '../../common/dto/pagination.dto';
import { DRIZZLE, type Database } from '../../database/database.module';
import { teams } from '../../database/schema';

import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

type Team = typeof teams.$inferSelect;

const SORTABLE: SortableMap = {
  name: teams.name,
  createdAt: teams.createdAt,
  updatedAt: teams.updatedAt,
};

@Injectable()
export class TeamsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(orgId: string, dto: CreateTeamDto): Promise<Team> {
    const [team] = await this.db
      .insert(teams)
      .values({
        organizationId: orgId,
        name: dto.name,
        description: dto.description,
      })
      .returning();
    return team;
  }

  async findAll(
    orgId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Team>> {
    const { page, limit, sort, order } = pagination;
    const where = and(
      eq(teams.organizationId, orgId),
      eq(teams.isActive, true),
    );

    const orderBy = resolveOrderBy(SORTABLE, sort, order, teams.createdAt);

    const [data, totalRows] = await Promise.all([
      this.db
        .select()
        .from(teams)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ value: count() }).from(teams).where(where),
    ]);

    return buildPaginatedResult(data, totalRows[0]?.value ?? 0, page, limit);
  }

  async findOne(orgId: string, id: string): Promise<Team> {
    const rows = await this.db
      .select()
      .from(teams)
      .where(and(eq(teams.id, id), eq(teams.organizationId, orgId)))
      .limit(1);
    const team = rows.at(0);

    if (!team) {
      throw new NotFoundException(`Team ${id} not found`);
    }
    return team;
  }

  async update(orgId: string, id: string, dto: UpdateTeamDto): Promise<Team> {
    await this.findOne(orgId, id);

    const [updated] = await this.db
      .update(teams)
      .set(dto)
      .where(and(eq(teams.id, id), eq(teams.organizationId, orgId)))
      .returning();

    return updated;
  }

  async softDelete(orgId: string, id: string): Promise<Team> {
    await this.findOne(orgId, id);

    const [deleted] = await this.db
      .update(teams)
      .set({ isActive: false })
      .where(and(eq(teams.id, id), eq(teams.organizationId, orgId)))
      .returning();

    return deleted;
  }
}
