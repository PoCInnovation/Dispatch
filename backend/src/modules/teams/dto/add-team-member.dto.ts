import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddTeamMemberDto {
  @ApiProperty({
    description: 'Id of the member (from /members) to add to the team',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  memberId!: string;

  @ApiProperty({
    description:
      'Id of the role (from /roles) to assign to this team membership',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  roleId!: string;
}
