import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Unique role name',
    minLength: 1,
    maxLength: 50,
    example: 'manager',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({
    description: 'Human-readable description of the role',
    maxLength: 500,
    example: 'Manages the team and its members.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
