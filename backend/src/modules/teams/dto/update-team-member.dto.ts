import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateTeamMemberDto {
  @ApiProperty({
    description: 'Id of the new role to assign to this team membership',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  roleId!: string;
}
