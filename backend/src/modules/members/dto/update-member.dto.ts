import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateMemberDto {
  @ApiPropertyOptional({
    description: 'Member email address',
    maxLength: 255,
    example: 'jane.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'Full display name',
    minLength: 1,
    maxLength: 200,
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Whether the member is active. Set to false to soft-delete.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Better Auth user id. Pass null to unlink from the underlying account.',
    nullable: true,
    example: 'usr_01HVQ...',
  })
  @IsOptional()
  @IsString()
  userId?: string | null;
}
