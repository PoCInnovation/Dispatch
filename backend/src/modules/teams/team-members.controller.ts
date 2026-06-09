import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrgRoles } from '@thallesp/nestjs-better-auth';

import { ActiveOrgId } from '../../common/decorators/active-org-id.decorator';

import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamMembersService } from './team-members.service';

@ApiTags('Team members')
@ApiCookieAuth('better-auth.session_token')
@ApiParam({ name: 'teamId', format: 'uuid', description: 'Team id' })
@Controller('teams/:teamId/members')
export class TeamMembersController {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  @Get()
  @ApiOperation({ summary: 'List members of a team' })
  @ApiResponse({ status: 200, description: 'List of team memberships.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'No active organization.' })
  @ApiResponse({ status: 404, description: 'Team not found.' })
  async list(
    @ActiveOrgId() orgId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
  ) {
    return await this.teamMembersService.list(orgId, teamId);
  }

  @Post()
  @OrgRoles(['owner', 'admin'])
  @ApiOperation({
    summary: 'Add a member to a team',
    description: 'Requires organization role `owner` or `admin`.',
  })
  @ApiResponse({ status: 201, description: 'Member added to the team.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient organization role.' })
  @ApiResponse({ status: 404, description: 'Team, member or role not found.' })
  @ApiResponse({
    status: 409,
    description: 'Member already belongs to this team.',
  })
  async add(
    @ActiveOrgId() orgId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() dto: AddTeamMemberDto,
  ) {
    return await this.teamMembersService.add(orgId, teamId, dto);
  }

  @Patch(':memberId')
  @OrgRoles(['owner', 'admin'])
  @ApiOperation({
    summary: 'Update the role of a team member',
    description: 'Requires organization role `owner` or `admin`.',
  })
  @ApiParam({
    name: 'memberId',
    format: 'uuid',
    description:
      'Member id (note: the id of the `members` row, not the team_member id).',
  })
  @ApiResponse({ status: 200, description: 'Team membership updated.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient organization role.' })
  @ApiResponse({ status: 404, description: 'Team, member or role not found.' })
  async updateRole(
    @ActiveOrgId() orgId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return await this.teamMembersService.updateRole(
      orgId,
      teamId,
      memberId,
      dto,
    );
  }

  @Delete(':memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @OrgRoles(['owner', 'admin'])
  @ApiOperation({
    summary: 'Remove a member from a team',
    description: 'Requires organization role `owner` or `admin`.',
  })
  @ApiParam({ name: 'memberId', format: 'uuid', description: 'Member id' })
  @ApiResponse({ status: 204, description: 'Member removed from the team.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient organization role.' })
  @ApiResponse({ status: 404, description: 'Team or membership not found.' })
  async remove(
    @ActiveOrgId() orgId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<void> {
    await this.teamMembersService.remove(orgId, teamId, memberId);
  }
}
