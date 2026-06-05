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
  Query,
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
import { PaginationDto } from '../../common/dto/pagination.dto';

import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsService } from './teams.service';

@ApiTags('Teams')
@ApiCookieAuth('better-auth.session_token')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({
    summary: 'List teams of the active organization',
    description:
      "Paginated list of teams scoped to the caller's active organization.",
  })
  @ApiResponse({ status: 200, description: 'Paginated list of teams.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'No active organization.' })
  async findAll(
    @ActiveOrgId() orgId: string,
    @Query() pagination: PaginationDto,
  ) {
    return await this.teamsService.findAll(orgId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single team by id (within active org)' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Team id' })
  @ApiResponse({ status: 200, description: 'The team.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'No active organization.' })
  @ApiResponse({
    status: 404,
    description: 'Team not found in this organization.',
  })
  async findOne(
    @ActiveOrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.teamsService.findOne(orgId, id);
  }

  @Post()
  @OrgRoles(['owner', 'admin'])
  @ApiOperation({
    summary: 'Create a team',
    description: 'Requires organization role `owner` or `admin`.',
  })
  @ApiResponse({ status: 201, description: 'Team created.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient organization role.' })
  async create(@ActiveOrgId() orgId: string, @Body() dto: CreateTeamDto) {
    return await this.teamsService.create(orgId, dto);
  }

  @Patch(':id')
  @OrgRoles(['owner', 'admin'])
  @ApiOperation({
    summary: 'Update a team',
    description: 'Requires organization role `owner` or `admin`.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Team id' })
  @ApiResponse({ status: 200, description: 'Team updated.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient organization role.' })
  @ApiResponse({ status: 404, description: 'Team not found.' })
  async update(
    @ActiveOrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return await this.teamsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @OrgRoles(['owner', 'admin'])
  @ApiOperation({
    summary: 'Soft-delete a team',
    description:
      'Marks the team as inactive instead of physically deleting the row. Requires organization role `owner` or `admin`.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Team id' })
  @ApiResponse({ status: 204, description: 'Team deactivated.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient organization role.' })
  @ApiResponse({ status: 404, description: 'Team not found.' })
  async remove(
    @ActiveOrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.teamsService.softDelete(orgId, id);
  }
}
