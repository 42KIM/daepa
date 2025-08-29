import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsDate, IsNumber, IsString } from 'class-validator';

export class PetImageDto {
  @ApiProperty({
    description: '펫 이미지 아이디',
    example: 1,
  })
  @IsString()
  id: number;

  @ApiProperty({
    description: '펫 이미지 파일',
    example: 'XXXXXXXX',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: '펫 이미지 원본 url',
    example: 'https://daepa.store/XXXXXXXX/bDbKDMjCVBtwRDSqvJvzH',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: '펫 이미지 파일 타입',
    example: 'image/jpeg',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: '펫 이미지 파일 크기',
    example: 1024,
  })
  @IsNumber()
  size: number;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  updatedAt: Date;
}

export class CreatePetImageDto extends OmitType(PetImageDto, [
  'id',
  'createdAt',
  'updatedAt',
]) {}
