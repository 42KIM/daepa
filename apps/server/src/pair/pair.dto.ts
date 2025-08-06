import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePairDto {
  @ApiProperty({
    description: '주인 아이디',
    example: '1',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  ownerId?: string;

  @ApiProperty({
    description: '아빠 펫 아이디',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  fatherId?: string;

  @ApiProperty({
    description: '엄마 펫 아이디',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  motherId?: string;
}
