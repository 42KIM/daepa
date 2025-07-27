import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class LayingBaseDto {
  @ApiProperty({
    description: 'Laying ID',
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Mating ID',
    example: 'XXXXXXXX',
    required: false,
  })
  @IsString()
  @IsOptional()
  matingId?: string;

  @ApiProperty({
    description: 'Laying Date',
    example: '2025-01-01',
  })
  @IsDate()
  layingDate: Date;

  @ApiProperty({
    description: '차수(클러치)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  clutch?: number;

  @ApiProperty({
    description: '생성일',
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
  })
  @IsDate()
  updatedAt: Date;
}

export class LayingDto extends PickType(LayingBaseDto, [
  'id',
  'matingId',
  'layingDate',
  'clutch',
]) {}

export class CreateLayingDto extends PickType(LayingBaseDto, [
  'matingId',
  'layingDate',
  'clutch',
]) {}

export class UpdateLayingDto extends PickType(LayingBaseDto, [
  'layingDate',
  'clutch',
]) {}

export class LayingByDateDto {
  @ApiProperty({
    description: '산란 날짜',
    example: '2025-01-01',
  })
  @IsDate()
  layingDate: Date;

  @ApiProperty({
    description: '산란 정보',
    isArray: true,
    type: LayingDto,
  })
  layings: LayingDto[];
}
