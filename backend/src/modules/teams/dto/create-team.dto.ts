import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({
    description: 'Team name',
    minLength: 1,
    maxLength: 100,
    example: 'Support — Tier 1',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional team description',
    maxLength: 500,
    example: 'First-line support team handling inbound tickets.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
