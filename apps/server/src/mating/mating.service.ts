import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateMatingDto,
  MatingBaseDto,
  MatingByParentsDto,
  MatingDto,
} from './mating.dto';
import { MatingEntity } from './mating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { PetSummaryDto } from 'src/pet/pet.dto';
import { PetEntity } from 'src/pet/pet.entity';
import { groupBy } from 'es-toolkit';
import { PET_SEX } from 'src/pet/pet.constants';
import { LayingEntity } from 'src/laying/laying.entity';
import { LayingDto } from 'src/laying/laying.dto';
import { UpdateMatingDto } from './mating.dto';
import { PageOptionsDto } from 'src/common/page.dto';
import { PageDto, PageMetaDto } from 'src/common/page.dto';
import { PairEntity } from 'src/pair/pair.entity';
import { Not } from 'typeorm';

interface MatingWithRelations extends Omit<MatingEntity, 'pair'> {
  layings?: Partial<LayingEntity>[];
  pair?: Partial<PairEntity>;
  parents?: Partial<PetEntity>[];
}

@Injectable()
export class MatingService {
  constructor(
    @InjectRepository(MatingEntity)
    private readonly matingRepository: Repository<MatingEntity>,
    @InjectRepository(LayingEntity)
    private readonly layingRepository: Repository<LayingEntity>,
    @InjectRepository(PairEntity)
    private readonly pairRepository: Repository<PairEntity>,
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
  ) {}

  async findAll(userId: string) {
    const entities = (await this.matingRepository
      .createQueryBuilder('matings')
      .leftJoinAndMapMany(
        'matings.layings',
        LayingEntity,
        'layings',
        'layings.matingId = matings.id',
      )
      .leftJoinAndMapOne(
        'matings.pair',
        PairEntity,
        'pairs',
        'pairs.id = matings.pairId',
      )
      .leftJoinAndMapMany(
        'matings.parents',
        PetEntity,
        'parents',
        'parents.petId IN (pairs.fatherId, pairs.motherId)',
      )
      .select([
        'matings.id',
        'matings.matingDate',
        'matings.pairId',
        'matings.createdAt',
        'layings.id',
        'layings.layingDate',
        'layings.clutch',
        'pairs.id',
        'pairs.fatherId',
        'pairs.motherId',
        'pairs.ownerId',
        'parents.petId',
        'parents.name',
        'parents.morphs',
        'parents.species',
        'parents.sex',
        'parents.hatchingDate',
        'parents.growth',
        'parents.weight',
      ])
      .where('pairs.ownerId = :userId', { userId })
      .orderBy('matings.createdAt', 'DESC')
      .addOrderBy('layings.layingDate', 'ASC')
      .getMany()) as MatingWithRelations[];

    return this.formatResponseByDate(entities);
  }

  async getMatingListFull(
    pageOptionsDto: PageOptionsDto,
    userId: string,
  ): Promise<PageDto<MatingByParentsDto>> {
    // 모든 메이팅 데이터를 가져와서 가공
    const allQueryBuilder = this.matingRepository
      .createQueryBuilder('matings')
      .leftJoinAndMapMany(
        'matings.layings',
        LayingEntity,
        'layings',
        'layings.matingId = matings.id',
      )
      .leftJoinAndMapOne(
        'matings.pair',
        PairEntity,
        'pairs',
        'pairs.id = matings.pairId',
      )
      .leftJoinAndMapMany(
        'matings.parents',
        PetEntity,
        'parents',
        'parents.petId IN (pairs.fatherId, pairs.motherId)',
      )
      .select([
        'matings.id',
        'matings.matingDate',
        'matings.pairId',
        'matings.createdAt',
        'layings.id',
        'layings.layingDate',
        'layings.clutch',
        'pairs.id',
        'pairs.fatherId',
        'pairs.motherId',
        'pairs.ownerId',
        'parents.petId',
        'parents.name',
        'parents.morphs',
        'parents.species',
        'parents.sex',
        'parents.hatchingDate',
        'parents.growth',
        'parents.weight',
      ])
      .where('pairs.ownerId = :userId', { userId })
      .orderBy('matings.id', pageOptionsDto.order);

    const { entities } = await allQueryBuilder.getRawAndEntities();

    // 가공된 데이터 생성
    const allMatingList = this.formatResponseByDate(
      entities as MatingWithRelations[],
    );

    // 가공 후 데이터로 페이지네이션 적용
    const totalCount = allMatingList.length;
    const startIndex = pageOptionsDto.skip;
    const endIndex = startIndex + pageOptionsDto.itemPerPage;
    const paginatedMatingList = allMatingList.slice(startIndex, endIndex);

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });
    return new PageDto(paginatedMatingList, pageMetaDto);
  }

  async saveMating(userId: string, createMatingDto: CreateMatingDto) {
    if (!createMatingDto.fatherId && !createMatingDto.motherId) {
      throw new BadRequestException('최소 하나의 부모 펫을 입력해야 합니다.');
    }

    // 페어가 존재하는지 확인하거나 생성
    let pair = await this.pairRepository.findOne({
      where: {
        ownerId: userId,
        fatherId: createMatingDto.fatherId,
        motherId: createMatingDto.motherId,
      },
    });

    if (!pair) {
      pair = this.pairRepository.create({
        ownerId: userId,
        fatherId: createMatingDto.fatherId,
        motherId: createMatingDto.motherId,
      });
      pair = await this.pairRepository.save(pair);
    }

    // 동일한 페어의 동일한 날짜에 메이팅이 있는지 확인
    const existingMating = await this.matingRepository.findOne({
      where: {
        pairId: pair.id.toString(),
        matingDate: createMatingDto.matingDate,
      },
    });

    if (existingMating) {
      throw new BadRequestException('이미 존재하는 메이팅 정보입니다.');
    }

    const matingEntity = this.matingRepository.create({
      pairId: pair.id.toString(),
      matingDate: createMatingDto.matingDate,
    });
    return await this.matingRepository.save(matingEntity);
  }

  async updateMating(
    userId: string,
    matingId: number,
    updateMatingDto: UpdateMatingDto,
  ) {
    const mating = await this.matingRepository.findOne({
      where: { id: matingId },
      relations: ['pair'],
    });

    if (!mating || mating.pair?.ownerId !== userId) {
      throw new BadRequestException('메이팅 정보를 찾을 수 없습니다.');
    }

    // 페어 정보 업데이트 또는 새 페어 생성
    let pair = await this.pairRepository.findOne({
      where: {
        ownerId: userId,
        fatherId: updateMatingDto.fatherId,
        motherId: updateMatingDto.motherId,
      },
    });

    if (!pair) {
      pair = this.pairRepository.create({
        ownerId: userId,
        fatherId: updateMatingDto.fatherId,
        motherId: updateMatingDto.motherId,
      });
      pair = await this.pairRepository.save(pair);
    }

    // 중복 체크 (자신을 제외하고)
    const existingMating = await this.matingRepository.findOne({
      where: {
        pairId: pair.id.toString(),
        matingDate: updateMatingDto.matingDate,
        id: Not(matingId),
      },
    });

    if (existingMating) {
      throw new BadRequestException('이미 존재하는 메이팅 정보입니다.');
    }

    await this.matingRepository.update(matingId, {
      pairId: pair.id.toString(),
      matingDate: updateMatingDto.matingDate,
    });
  }

  async deleteMating(userId: string, matingId: number) {
    const mating = await this.matingRepository.findOne({
      where: { id: matingId },
      relations: ['pair'],
    });

    if (!mating || mating.pair.ownerId !== userId) {
      throw new BadRequestException('메이팅 정보를 찾을 수 없습니다.');
    }

    // 연관된 산란 정보가 있는지 확인
    const relatedLayings = await this.layingRepository.find({
      where: { matingId: mating.id.toString() },
    });

    if (relatedLayings.length > 0) {
      throw new BadRequestException(
        '연관된 산란 정보가 있어 삭제할 수 없습니다.',
      );
    }

    await this.matingRepository.delete(matingId);
  }

  private formatResponseByDate(data: MatingWithRelations[]) {
    const resultDto = data.map((mating) => {
      const matingDto = plainToInstance(MatingDto, {
        id: mating.id,
        matingDate: mating.matingDate,
        fatherId: mating.pair?.fatherId,
        motherId: mating.pair?.motherId,
      });
      const layingDto = mating.layings?.map((laying) =>
        plainToInstance(LayingDto, laying),
      );
      const parentsDto = mating.parents?.map((parent) =>
        plainToInstance(PetSummaryDto, parent),
      );
      return {
        ...matingDto,
        layings: layingDto,
        parents: parentsDto,
      };
    });

    const groupedByParents = groupBy(resultDto, (mating) => {
      const fatherId = mating.fatherId ?? 'null';
      const motherId = mating.motherId ?? 'null';

      // 부모 중 null 값이 있는 경우 각각 다른 그룹으로 처리
      if (mating.fatherId === null || mating.motherId === null) {
        return `${fatherId}-${motherId}-${mating.id}`;
      }

      return `${fatherId}-${motherId}`;
    });

    return Object.values(groupedByParents).map((matingByParents) => {
      const { parents } = matingByParents[0];
      const father = parents?.find((parent) => parent.sex === PET_SEX.MALE);
      const mother = parents?.find((parent) => parent.sex === PET_SEX.FEMALE);

      const matingsByDate = matingByParents
        .map((mating) => {
          const { id, matingDate, layings } = mating;
          const layingsByDate = this.groupLayingsByDate(layings);
          return {
            id,
            matingDate,
            layingsByDate,
          };
        })
        .sort(
          (a, b) =>
            new Date(b.matingDate).getTime() - new Date(a.matingDate).getTime(),
        );

      return {
        father,
        mother,
        matingsByDate,
      };
    });
  }

  private groupLayingsByDate(layings: LayingDto[] | undefined) {
    if (!layings?.length) return;

    const grouped = groupBy(layings, (laying) => laying.layingDate.toString());

    return Object.entries(grouped).map(([layingDate, layingsForDate]) => ({
      layingDate: new Date(parseInt(layingDate, 10)),
      layings: layingsForDate.map((laying) =>
        plainToInstance(LayingDto, laying),
      ),
    }));
  }

  async isMatingExist(criteria: Partial<MatingBaseDto>) {
    const isExist = await this.matingRepository.existsBy(criteria);
    return isExist;
  }
}
