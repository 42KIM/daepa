import {
  ApiExtraModels,
  ApiProperty,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { PET_SPECIES } from 'src/pet/pet.constants';

// ============================================
// Enums
// ============================================

export enum StatisticsPeriodType {
  ALL = 'ALL',
  SEASON = 'SEASON',
  YEAR_MONTH = 'YEAR_MONTH',
}

// ============================================
// Base DTOs
// ============================================

export class StatisticsPeriodDto {
  @ApiProperty({
    description: '기간 타입',
    enum: StatisticsPeriodType,
    example: StatisticsPeriodType.ALL,
    'x-enumNames': Object.keys(StatisticsPeriodType),
  })
  @IsEnum(StatisticsPeriodType)
  type: StatisticsPeriodType;

  @ApiProperty({
    description: '시즌 (예: 2024-2025)',
    example: '2024-2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  season?: string;

  @ApiProperty({
    description: '연도',
    example: 2024,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiProperty({
    description: '월 (1-12)',
    example: 6,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  month?: number;
}

export class EggStatisticsDto {
  @ApiProperty({ description: '전체 알 수', example: 50 })
  @IsNumber()
  total: number;

  @ApiProperty({ description: '유정란 수', example: 40 })
  @IsNumber()
  fertilized: number;

  @ApiProperty({ description: '무정란 수', example: 5 })
  @IsNumber()
  unfertilized: number;

  @ApiProperty({ description: '부화 완료 수', example: 35 })
  @IsNumber()
  hatched: number;

  @ApiProperty({ description: '중지란/사망 수', example: 5 })
  @IsNumber()
  dead: number;

  @ApiProperty({ description: '미정 수 (상태 미확인)', example: 3 })
  @IsNumber()
  pending: number;

  @ApiProperty({ description: '유정란 비율 (%)', example: 80.0 })
  @IsNumber()
  fertilizedRate: number;

  @ApiProperty({ description: '부화 성공율 (%)', example: 87.5 })
  @IsNumber()
  hatchingRate: number;
}

export class DistributionItemDto {
  @ApiProperty({ description: '항목명', example: 'Lilly White' })
  @IsString()
  key: string;

  @ApiProperty({ description: '개수', example: 10 })
  @IsNumber()
  count: number;

  @ApiProperty({ description: '비율 (%)', example: 25.0 })
  @IsNumber()
  percentage: number;
}

export class SexStatisticsDto {
  @ApiProperty({ description: '수컷 수', example: 15 })
  @IsNumber()
  male: number;

  @ApiProperty({ description: '암컷 수', example: 20 })
  @IsNumber()
  female: number;

  @ApiProperty({ description: '미확인 수', example: 5 })
  @IsNumber()
  unknown: number;

  @ApiProperty({ description: '수컷 비율 (%)', example: 42.9 })
  @IsNumber()
  maleRate: number;

  @ApiProperty({ description: '암컷 비율 (%)', example: 57.1 })
  @IsNumber()
  femaleRate: number;
}

export class StatisticsMetaDto {
  @ApiProperty({ description: '총 메이팅 횟수', example: 5 })
  @IsNumber()
  totalMatings: number;

  @ApiProperty({ description: '총 산란 횟수', example: 10 })
  @IsNumber()
  totalLayings: number;
}

export class MonthlyStatisticsItemDto {
  @ApiProperty({ description: '월 (1-12)', example: 1 })
  @IsNumber()
  month: number;

  @ApiProperty({ description: '총 알 수', example: 14 })
  @IsNumber()
  total: number;

  @ApiProperty({ description: '유정란 수 (부화 포함)', example: 8 })
  @IsNumber()
  fertilized: number;

  @ApiProperty({ description: '무정란 수', example: 2 })
  @IsNumber()
  unfertilized: number;

  @ApiProperty({ description: '중지란/사망 수', example: 1 })
  @IsNumber()
  dead: number;

  @ApiProperty({ description: '미정 수 (상태 미확인)', example: 3 })
  @IsNumber()
  pending: number;

  @ApiProperty({ description: '부화 완료 수', example: 6 })
  @IsNumber()
  hatched: number;
}

// ============================================
// Statistics Base DTO (공통 통계 필드)
// ============================================

@ApiExtraModels(
  StatisticsPeriodDto,
  EggStatisticsDto,
  DistributionItemDto,
  SexStatisticsDto,
  StatisticsMetaDto,
  MonthlyStatisticsItemDto,
)
class StatisticsBaseDto {
  @ApiProperty({
    description: '기간 정보',
    type: StatisticsPeriodDto,
  })
  @IsObject()
  @Type(() => StatisticsPeriodDto)
  period: StatisticsPeriodDto;

  @ApiProperty({
    description: '알 통계',
    type: EggStatisticsDto,
  })
  @IsObject()
  @Type(() => EggStatisticsDto)
  egg: EggStatisticsDto;

  @ApiProperty({
    description: '모프 분포',
    type: [DistributionItemDto],
  })
  @IsArray()
  @IsObject({ each: true })
  @Type(() => DistributionItemDto)
  morphs: DistributionItemDto[];

  @ApiProperty({
    description: '형질 분포',
    type: [DistributionItemDto],
  })
  @IsArray()
  @IsObject({ each: true })
  @Type(() => DistributionItemDto)
  traits: DistributionItemDto[];

  @ApiProperty({
    description: '성별 통계',
    type: SexStatisticsDto,
  })
  @IsObject()
  @Type(() => SexStatisticsDto)
  sex: SexStatisticsDto;

  @ApiProperty({
    description: '메타 정보',
    type: StatisticsMetaDto,
  })
  @IsObject()
  @Type(() => StatisticsMetaDto)
  meta: StatisticsMetaDto;

  @ApiProperty({
    description: '월별 통계 (연도만 선택된 경우)',
    type: [MonthlyStatisticsItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @Type(() => MonthlyStatisticsItemDto)
  monthlyStats?: MonthlyStatisticsItemDto[];
}

// ============================================
// Response DTOs
// ============================================

export class PairStatisticsDto extends StatisticsBaseDto {
  @ApiProperty({
    description: '페어 ID',
    example: 1,
  })
  @IsNumber()
  pairId: number;
}

export class ParentStatisticsDto extends StatisticsBaseDto {
  @ApiProperty({
    description: '부 개체 ID',
    example: 'pet-uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  fatherId?: string;

  @ApiProperty({
    description: '모 개체 ID',
    example: 'pet-uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  motherId?: string;
}

// ============================================
// Query DTOs
// ============================================

class StatisticsQueryBaseDto {
  @ApiProperty({
    description: '연도',
    example: 2024,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  year?: number;

  @ApiProperty({
    description: '월 (1-12)',
    example: 6,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  month?: number;

  @ApiProperty({
    description: '종',
    enum: PET_SPECIES,
    example: PET_SPECIES.CRESTED,
    'x-enumNames': Object.keys(PET_SPECIES),
    required: false,
  })
  @IsOptional()
  @IsString()
  species?: string;

  @ApiProperty({
    description: '부 개체 ID',
    example: 'pet-uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  fatherId?: string;

  @ApiProperty({
    description: '모 개체 ID',
    example: 'pet-uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  motherId?: string;
}

export class PairStatisticsQueryDto extends PickType(StatisticsQueryBaseDto, [
  'year',
  'month',
  'species',
  'fatherId',
  'motherId',
]) {}

export class ParentStatisticsQueryDto extends OmitType(
  StatisticsQueryBaseDto,
  [],
) {}
