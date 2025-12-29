import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { PairEntity } from 'src/pair/pair.entity';
import { MatingEntity } from 'src/mating/mating.entity';
import { LayingEntity } from 'src/laying/laying.entity';
import { PetEntity } from 'src/pet/pet.entity';
import { EggDetailEntity } from 'src/egg_detail/egg_detail.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { EGG_STATUS } from 'src/egg_detail/egg_detail.constants';
import { PET_SEX } from 'src/pet/pet.constants';
import {
  ParentStatisticsDto,
  StatisticsPeriodType,
  EggStatisticsDto,
  SexStatisticsDto,
  StatisticsMetaDto,
  DistributionItemDto,
  StatisticsPeriodDto,
  MonthlyStatisticsItemDto,
} from './statistics.dto';

interface PetWithDetails {
  petId: string;
  layingId: number | null;
  eggDetail?: {
    status: EGG_STATUS | null;
  };
  petDetail?: {
    sex: PET_SEX | null;
    morphs: string[] | null;
    traits: string[] | null;
  };
  laying?: {
    layingDate: Date | null;
  };
}

interface LayingWithDate {
  id: number;
  matingId: number;
  layingDate: Date | null;
}

@Injectable()
export class StatisticsService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 통계 조회 (종, 부, 모 개체 기준 - 종만 선택해도 조회 가능)
   */
  async getPairStatistics(
    userId: string,
    species?: string,
    fatherId?: string,
    motherId?: string,
    year?: number,
    month?: number,
  ): Promise<ParentStatisticsDto> {
    if (!species && !fatherId && !motherId) {
      return this.buildEmptyParentStatistics(fatherId, motherId, year, month);
    }

    // 1) 조건에 맞는 페어 ID들 조회
    const pairIds = await this.getPairIdsByConditions(
      userId,
      species,
      fatherId,
      motherId,
    );

    if (pairIds.length === 0) {
      return this.buildEmptyParentStatistics(fatherId, motherId, year, month);
    }

    // 2) 해당 페어들의 메이팅 ID 조회
    const matingEntities = await this.dataSource
      .createQueryBuilder(MatingEntity, 'mating')
      .where('mating.pairId IN (:...pairIds)', { pairIds })
      .select(['mating.id', 'mating.pairId'])
      .getMany();

    if (matingEntities.length === 0) {
      return this.buildEmptyParentStatistics(fatherId, motherId, year, month);
    }

    const matingIds = matingEntities.map((m) => m.id);
    const totalMatings = matingIds.length;

    // 3) 메이팅 ID로 산란 정보 배치 조회
    let layingQuery = this.dataSource
      .createQueryBuilder(LayingEntity, 'laying')
      .where('laying.matingId IN (:...matingIds)', { matingIds })
      .select(['laying.id', 'laying.matingId', 'laying.layingDate']);

    if (year) {
      const dateRange = this.getYearMonthDateRange(year, month);
      layingQuery = layingQuery.andWhere(
        'laying.layingDate BETWEEN :start AND :end',
        { start: dateRange.start, end: dateRange.end },
      );
    }

    const layingEntities = await layingQuery.getMany();

    if (layingEntities.length === 0) {
      return this.buildEmptyParentStatistics(fatherId, motherId, year, month);
    }

    const layingsForStats: LayingWithDate[] = layingEntities.map((laying) => ({
      id: laying.id,
      matingId: laying.matingId ?? -1,
      layingDate: laying.layingDate ?? null,
    }));

    const layingIds = layingsForStats.map((l) => l.id);
    const totalLayings = layingIds.length;

    // 4) 산란 ID로 펫 정보 배치 조회
    const petEntities = await this.dataSource
      .createQueryBuilder(PetEntity, 'pet')
      .leftJoinAndMapOne(
        'pet.eggDetail',
        EggDetailEntity,
        'eggDetail',
        'eggDetail.petId = pet.petId',
      )
      .leftJoinAndMapOne(
        'pet.petDetail',
        PetDetailEntity,
        'petDetail',
        'petDetail.petId = pet.petId',
      )
      .where('pet.layingId IN (:...layingIds)', { layingIds })
      .andWhere('pet.isDeleted = false')
      .select([
        'pet.petId',
        'pet.layingId',
        'eggDetail.status',
        'petDetail.sex',
        'petDetail.morphs',
        'petDetail.traits',
      ])
      .getMany();

    // 5) 펫과 산란 정보 조합
    const layingByIdMap = new Map<number, LayingWithDate>();
    for (const laying of layingsForStats) {
      layingByIdMap.set(laying.id, laying);
    }

    const petsWithLayingDate: PetWithDetails[] = petEntities.map((pet) => {
      const laying = pet.layingId ? layingByIdMap.get(pet.layingId) : undefined;
      return {
        petId: pet.petId,
        layingId: pet.layingId ?? null,
        eggDetail: pet.eggDetail
          ? { status: pet.eggDetail.status ?? null }
          : undefined,
        petDetail: pet.petDetail
          ? {
              sex: pet.petDetail.sex ?? null,
              morphs: pet.petDetail.morphs ?? null,
              traits: pet.petDetail.traits ?? null,
            }
          : undefined,
        laying: laying ? { layingDate: laying.layingDate } : undefined,
      };
    });

    // 6) 통계 계산 및 반환
    return this.buildParentStatistics(
      fatherId,
      motherId,
      petsWithLayingDate,
      totalMatings,
      totalLayings,
      year,
      month,
    );
  }

  /**
   * 조건에 맞는 페어 ID 조회 (종, 부, 모 개체)
   */
  private async getPairIdsByConditions(
    userId: string,
    species?: string,
    fatherId?: string,
    motherId?: string,
  ): Promise<number[]> {
    const query = this.dataSource
      .createQueryBuilder(PairEntity, 'pair')
      .where('pair.ownerId = :userId', { userId })
      .select(['pair.id']);

    if (species) {
      query.andWhere('pair.species = :species', { species });
    }

    if (fatherId && motherId) {
      query.andWhere(
        'pair.fatherId = :fatherId AND pair.motherId = :motherId',
        { fatherId, motherId },
      );
    } else if (fatherId) {
      query.andWhere('pair.fatherId = :fatherId', { fatherId });
    } else if (motherId) {
      query.andWhere('pair.motherId = :motherId', { motherId });
    }

    const pairs = await query.getMany();
    return pairs.map((p) => p.id);
  }

  /**
   * 부모 통계 데이터 생성
   */
  private buildParentStatistics(
    fatherId: string | undefined,
    motherId: string | undefined,
    pets: PetWithDetails[],
    totalMatings: number,
    totalLayings: number,
    year?: number,
    month?: number,
  ): ParentStatisticsDto {
    const period = this.buildPeriod(year, month);
    const egg = this.buildEggStatistics(pets);
    const hatchedPets = pets.filter(
      (p) => p.eggDetail?.status === EGG_STATUS.HATCHED,
    );
    const morphs = this.buildDistribution(
      hatchedPets,
      (p) => p.petDetail?.morphs ?? null,
    );
    const traits = this.buildDistribution(
      hatchedPets,
      (p) => p.petDetail?.traits ?? null,
    );
    const sex = this.buildSexStatistics(hatchedPets);
    const meta = this.buildMeta(totalMatings, totalLayings);

    // 연도만 선택된 경우 월별 통계 추가
    const monthlyStats =
      year && !month ? this.buildMonthlyStatistics(pets) : undefined;

    return plainToInstance(ParentStatisticsDto, {
      fatherId,
      motherId,
      period,
      egg,
      morphs,
      traits,
      sex,
      meta,
      monthlyStats,
    });
  }

  /**
   * 빈 부모 통계 데이터 생성
   */
  private buildEmptyParentStatistics(
    fatherId?: string,
    motherId?: string,
    year?: number,
    month?: number,
  ): ParentStatisticsDto {
    return plainToInstance(ParentStatisticsDto, {
      fatherId,
      motherId,
      period: this.buildPeriod(year, month),
      egg: plainToInstance(EggStatisticsDto, {
        total: 0,
        fertilized: 0,
        unfertilized: 0,
        hatched: 0,
        dead: 0,
        pending: 0,
        fertilizedRate: 0,
        hatchingRate: 0,
      }),
      morphs: [],
      traits: [],
      sex: plainToInstance(SexStatisticsDto, {
        male: 0,
        female: 0,
        unknown: 0,
        maleRate: 0,
        femaleRate: 0,
      }),
      meta: plainToInstance(StatisticsMetaDto, {
        totalMatings: 0,
        totalLayings: 0,
      }),
    });
  }

  /**
   * 기간 정보 생성
   */
  private buildPeriod(year?: number, month?: number): StatisticsPeriodDto {
    const hasFilter = year !== undefined;
    return plainToInstance(StatisticsPeriodDto, {
      type: hasFilter
        ? StatisticsPeriodType.YEAR_MONTH
        : StatisticsPeriodType.ALL,
      year,
      month,
    });
  }

  /**
   * 알 통계 생성
   */
  private buildEggStatistics(pets: PetWithDetails[]): EggStatisticsDto {
    const total = pets.length;

    const fertilized = pets.filter(
      (p) =>
        p.eggDetail?.status === EGG_STATUS.FERTILIZED ||
        p.eggDetail?.status === EGG_STATUS.HATCHED,
    ).length;

    const unfertilized = pets.filter(
      (p) => p.eggDetail?.status === EGG_STATUS.UNFERTILIZED,
    ).length;

    const hatched = pets.filter(
      (p) => p.eggDetail?.status === EGG_STATUS.HATCHED,
    ).length;

    const dead = pets.filter(
      (p) => p.eggDetail?.status === EGG_STATUS.DEAD,
    ).length;

    const pending = pets.filter((p) => !p.eggDetail?.status).length;

    return plainToInstance(EggStatisticsDto, {
      total,
      fertilized,
      unfertilized,
      hatched,
      dead,
      pending,
      fertilizedRate: this.calculateRate(fertilized, total),
      hatchingRate: this.calculateRate(hatched, fertilized),
    });
  }

  /**
   * 성별 통계 생성
   */
  private buildSexStatistics(hatchedPets: PetWithDetails[]): SexStatisticsDto {
    const male = hatchedPets.filter(
      (p) => p.petDetail?.sex === PET_SEX.MALE,
    ).length;
    const female = hatchedPets.filter(
      (p) => p.petDetail?.sex === PET_SEX.FEMALE,
    ).length;
    const unknown = hatchedPets.filter(
      (p) => !p.petDetail?.sex || p.petDetail?.sex === PET_SEX.NON,
    ).length;
    const sexTotal = male + female;

    return plainToInstance(SexStatisticsDto, {
      male,
      female,
      unknown,
      maleRate: this.calculateRate(male, sexTotal),
      femaleRate: this.calculateRate(female, sexTotal),
    });
  }

  /**
   * 메타 정보 생성
   */
  private buildMeta(
    totalMatings: number,
    totalLayings: number,
  ): StatisticsMetaDto {
    return plainToInstance(StatisticsMetaDto, {
      totalMatings,
      totalLayings,
    });
  }

  /**
   * 분포 통계 생성
   */
  private buildDistribution(
    pets: PetWithDetails[],
    getItems: (pet: PetWithDetails) => string[] | null,
  ): DistributionItemDto[] {
    const countsMap = new Map<string, number>();
    let total = 0;

    for (const pet of pets) {
      const items = getItems(pet);
      if (items && items.length > 0) {
        for (const item of items) {
          countsMap.set(item, (countsMap.get(item) || 0) + 1);
          total++;
        }
      }
    }

    return Array.from(countsMap.entries())
      .map(([key, count]) =>
        plainToInstance(DistributionItemDto, {
          key,
          count,
          percentage: this.calculateRate(count, total),
        }),
      )
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 비율 계산 (소수점 첫째 자리)
   */
  private calculateRate(count: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((count / total) * 1000) / 10;
  }

  /**
   * 월별 통계 생성 (연도만 선택된 경우)
   */
  private buildMonthlyStatistics(
    pets: PetWithDetails[],
  ): MonthlyStatisticsItemDto[] {
    const monthlyData = new Map<
      number,
      {
        fertilized: number;
        unfertilized: number;
        dead: number;
        pending: number;
        hatched: number;
      }
    >();

    // 1-12월 초기화
    for (let m = 1; m <= 12; m++) {
      monthlyData.set(m, {
        fertilized: 0,
        unfertilized: 0,
        dead: 0,
        pending: 0,
        hatched: 0,
      });
    }

    // 월별 데이터 집계
    for (const pet of pets) {
      const layingDate = pet.laying?.layingDate;
      if (layingDate) {
        const month = new Date(layingDate).getMonth() + 1;
        const data = monthlyData.get(month)!;
        const eggStatus = pet.eggDetail?.status;

        if (eggStatus === EGG_STATUS.HATCHED) {
          data.fertilized++;
          data.hatched++;
        } else if (eggStatus === EGG_STATUS.FERTILIZED) {
          data.fertilized++;
        } else if (eggStatus === EGG_STATUS.UNFERTILIZED) {
          data.unfertilized++;
        } else if (eggStatus === EGG_STATUS.DEAD) {
          data.dead++;
        } else {
          // eggStatus가 null인 경우
          data.pending++;
        }
      }
    }

    return Array.from(monthlyData.entries()).map(([month, data]) =>
      plainToInstance(MonthlyStatisticsItemDto, {
        month,
        total: data.fertilized + data.unfertilized + data.dead + data.pending,
        fertilized: data.fertilized,
        unfertilized: data.unfertilized,
        dead: data.dead,
        pending: data.pending,
        hatched: data.hatched,
      }),
    );
  }

  /**
   * 연도/월 기준 날짜 범위 계산
   */
  private getYearMonthDateRange(
    year: number,
    month?: number,
  ): { start: Date; end: Date } {
    if (month) {
      // 특정 월 선택 시: 해당 월의 1일부터 말일까지
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0); // 다음 달 0일 = 해당 월 말일
      return { start, end };
    }

    // 연도만 선택 시: 해당 연도 1월 1일부터 12월 31일까지
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31),
    };
  }
}
