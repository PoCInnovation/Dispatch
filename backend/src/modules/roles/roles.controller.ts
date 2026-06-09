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

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiCookieAuth('better-auth.session_token')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({
    summary: 'List roles',
    description:
      'Roles are scoped to the active organization. Default roles (owner/manager/agent) are seeded automatically when an organization is created.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of roles.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'No active organization.' })
  async findAll(
    @ActiveOrgId() orgId: string,
    @Query() pagination: PaginationDto,
  ) {
    return await this.rolesService.findAll(orgId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single role by id (within active org)' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Role id' })
  @ApiResponse({ status: 200, description: 'The role.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'No active organization.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  async findOne(
    @ActiveOrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.rolesService.findOne(orgId, id);
  }

  @Post()
  @OrgRoles(['owner', 'admin'])
  @ApiOperation({
    summary: 'Create a role in the active organization',
    description: 'Requires organization role `owner` or `admin`.',
  })
  @ApiResponse({ status: 201, description: 'Role created.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient organization role.' })
  @ApiResponse({
    status: 409,
    description: 'A role with this name already exists in this organization.',
  })
  async create(@ActiveOrgId() orgId: string, @Body() dto: CreateRoleDto) {
    return await this.rolesService.create(orgId, dto);
  }

  @Patch(':id')
  @OrgRoles(['owner', 'admin'])
  @ApiOperation({
    summary: 'Update a role within the active organization',
    description:
      'Requires organization role `owner` or `admin`. Default roles (owner/manager/agent) cannot be renamed but their description can be edited.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Role id' })
  @ApiResponse({ status: 200, description: 'Role updated.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient organization role.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({
    status: 409,
    description:
      'A role with this name already exists, or the role is a default role and cannot be renamed.',
  })
  async update(
    @ActiveOrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return await this.rolesService.update(orgId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @OrgRoles(['owner', 'admin'])
  @ApiOperation({
    summary: 'Delete a role within the active organization',
    description:
      'Requires organization role `owner` or `admin`. Default roles (owner/manager/agent) cannot be deleted.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Role id' })
  @ApiResponse({ status: 204, description: 'Role deleted.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient organization role.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @ApiResponse({
    status: 409,
    description:
      'Role is a default role, or is still referenced by team memberships.',
  })
  async remove(
    @ActiveOrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.rolesService.remove(orgId, id);
  }
}
