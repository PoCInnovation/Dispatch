import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DRIZZLE, type Database } from '../../database/database.module';
import { members, roles, teamMembers, teams } from '../../database/schema';

import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

type TeamMember = typeof teamMembers.$inferSelect;

@Injectable()
export class TeamMembersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(orgId: string, teamId: string) {
    await this.ensureTeam(orgId, teamId);

    return await this.db
      .select({
        id: teamMembers.id,
        joinedAt: teamMembers.joinedAt,
        member: {
          id: members.id,
          email: members.email,
          fullName: members.fullName,
          isActive: members.isActive,
        },
        role: {
          id: roles.id,
          name: roles.name,
          description: roles.description,
        },
      })
      .from(teamMembers)
      .innerJoin(members, eq(teamMembers.memberId, members.id))
      .innerJoin(roles, eq(teamMembers.roleId, roles.id))
      .where(eq(teamMembers.teamId, teamId));
  }

  async add(
    orgId: string,
    teamId: string,
    dto: AddTeamMemberDto,
  ): Promise<TeamMember> {
    await this.ensureTeam(orgId, teamId);
    await this.ensureMemberInOrg(orgId, dto.memberId);
    await this.ensureRole(orgId, dto.roleId);

    const existing = await this.db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.memberId, dto.memberId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Member already in this team');
    }

    const [created] = await this.db
      .insert(teamMembers)
      .values({
        teamId,
        memberId: dto.memberId,
        roleId: dto.roleId,
      })
      .returning();
    return created;
  }

  async updateRole(
    orgId: string,
    teamId: string,
    memberId: string,
    dto: UpdateTeamMemberDto,
  ): Promise<TeamMember> {
    await this.ensureTeam(orgId, teamId);
    await this.ensureRole(orgId, dto.roleId);

    const rows = await this.db
      .update(teamMembers)
      .set({ roleId: dto.roleId })
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.memberId, memberId)),
      )
      .returning();
    const updated = rows.at(0);

    if (!updated) {
      throw new NotFoundException('Member not in this team');
    }
    return updated;
  }

  async remove(orgId: string, teamId: string, memberId: string): Promise<void> {
    await this.ensureTeam(orgId, teamId);

    const rows = await this.db
      .delete(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.memberId, memberId)),
      )
      .returning({ id: teamMembers.id });

    if (rows.length === 0) {
      throw new NotFoundException('Member not in this team');
    }
  }

  private async ensureTeam(orgId: string, teamId: string): Promise<void> {
    const rows = await this.db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.id, teamId), eq(teams.organizationId, orgId)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException(`Team ${teamId} not found`);
    }
  }

  private async ensureMemberInOrg(
    orgId: string,
    memberId: string,
  ): Promise<void> {
    const rows = await this.db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.organizationId, orgId)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }
  }

  private async ensureRole(orgId: string, roleId: string): Promise<void> {
    const rows = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.organizationId, orgId)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }
  }
}
