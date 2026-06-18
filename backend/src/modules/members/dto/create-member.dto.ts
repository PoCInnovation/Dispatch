import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({
    description: 'Member email address (unique per organization)',
    maxLength: 255,
    example: 'jane.doe@example.com',
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    description: 'Full display name',
    minLength: 1,
    maxLength: 200,
    example: 'Jane Doe',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName!: string;

  @ApiPropertyOptional({
    description:
      'Better Auth user id to link this member to an existing account',
    example: 'usr_01HVQ...',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
