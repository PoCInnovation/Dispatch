import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateTeamDto {
  @ApiPropertyOptional({
    description: 'Team name',
    minLength: 1,
    maxLength: 100,
    example: 'Support — Tier 1',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Optional team description',
    maxLength: 500,
    example: 'First-line support team handling inbound tickets.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the team is active. Set to false to soft-delete.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
