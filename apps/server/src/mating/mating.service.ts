import { Injectable } from '@nestjs/common';
import { CreateMatingDto, MatingDto } from './mating.dto';
import { MatingEntity } from './mating.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { LayingBaseDto } from '../laying/laying.dto';
import { PetSummaryDto } from 'src/pet/pet.dto';
import { PetEntity } from 'src/pet/pet.entity';
import { LayingEntity } from 'src/laying/laying.entity';

interface MatingWithRelations extends MatingEntity {
  layings?: Partial<LayingEntity>[];
  parents?: Partial<PetEntity>[];
}

@Injectable()
export class MatingService {
  constructor(
    @InjectRepository(MatingEntity)
    private readonly matingRepository: Repository<MatingEntity>,
  ) {}

  async findAll(userId: string) {
    const result = (await this.matingRepository
      .createQueryBuilder('matings')
      .leftJoinAndMapMany(
        'matings.layings',
        LayingEntity,
        'layings',
        'layings.matingId = matings.id',
      )
      .leftJoinAndMapMany(
        'matings.parents',
        PetEntity,
        'parents',
        'parents.petId IN (matings.fatherId, matings.motherId)',
      )
      .select([
        'matings.id',
        'matings.matingDate',
        'matings.fatherId',
        'matings.motherId',
        'layings.id',
        'layings.eggId',
        'layings.layingDate',
        'layings.layingOrder',
        'layings.eggType',
        'layings.temperture',
        'parents.petId',
        'parents.name',
        'parents.morphs',
        'parents.species',
        'parents.sex',
        'parents.birthdate',
        'parents.growth',
        'parents.weight',
      ])
      .where('matings.user_id = :userId', { userId })
      .orderBy('matings.createdAt', 'DESC')
      .addOrderBy('layings.layingOrder', 'ASC')
      .getMany()) as MatingWithRelations[];

    return result.map((mating) => {
      const matingDto = plainToInstance(MatingDto, mating);
      const layingsDto = mating.layings?.map((laying) =>
        plainToInstance(LayingBaseDto, laying),
      );
      const parentsDto = mating.parents?.map((parent) =>
        plainToInstance(PetSummaryDto, parent),
      );
      return {
        ...matingDto,
        layings: layingsDto,
        parents: parentsDto,
      };
    });
  }

  async saveMating(userId: string, createMatingDto: CreateMatingDto) {
    const matingEntity = this.matingRepository.create({
      ...createMatingDto,
      userId,
    });
    return await this.matingRepository.save(matingEntity);
  }
}
