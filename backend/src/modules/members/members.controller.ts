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

import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';

@ApiTags('Members')
@ApiCookieAuth('better-auth.session_token')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOperation({
    summary: 'List members of the active organization',
    description:
      "Paginated list of members scoped to the caller's active organization.",
  })
  @ApiResponse({ status: 200, description: 'Paginated list of members.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'No active organization.' })
  async findAll(
    @ActiveOrgId() orgId: string,
    @Query() pagination: PaginationDto,
  ) {
    return await this.membersService.findAll(orgId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single member by id (within active org)' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Member id' })
  @ApiResponse({ status: 200, description: 'The member.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'No active organization.' })
  @ApiResponse({
    status: 404,
    description: 'Member not found in this organization.',
  })
  async findOne(
    @ActiveOrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.membersService.findOne(orgId, id);
  }

  @Post()
  @OrgRoles(['owner', 'admin'])
  @ApiOperation({
    summary: 'Create a member',
    description: 'Requires organization role `owner` or `admin`.',
  })
  @ApiResponse({ status: 201, description: 'Member created.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient organization role.' })
  @ApiResponse({
    status: 409,
    description:
      'A member with this email already exists in this organization.',
  })
  async create(@ActiveOrgId() orgId: string, @Body() dto: CreateMemberDto) {
    return await this.membersService.create(orgId, dto);
  }

  @Patch(':id')
  @OrgRoles(['owner', 'admin'])
  @ApiOperation({
    summary: 'Update a member',
    description: 'Requires organization role `owner` or `admin`.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Member id' })
  @ApiResponse({ status: 200, description: 'Member updated.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient organization role.' })
  @ApiResponse({ status: 404, description: 'Member not found.' })
  async update(
    @ActiveOrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return await this.membersService.update(orgId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @OrgRoles(['owner', 'admin'])
  @ApiOperation({
    summary: 'Soft-delete a member',
    description:
      'Marks the member as inactive instead of physically deleting the row. Requires organization role `owner` or `admin`.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Member id' })
  @ApiResponse({ status: 204, description: 'Member deactivated.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'Insufficient organization role.' })
  @ApiResponse({ status: 404, description: 'Member not found.' })
  async remove(
    @ActiveOrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.membersService.softDelete(orgId, id);
  }
}
