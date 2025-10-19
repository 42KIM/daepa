import { Injectable } from '@nestjs/common';
import { PET_SPECIES } from 'src/pet/pet.constants';
import { DataSource } from 'typeorm';
import { PairEntity } from './pair.entity';
import { PetEntity } from 'src/pet/pet.entity';
import { PetDetailEntity } from 'src/pet_detail/pet_detail.entity';
import { uniq } from 'es-toolkit';
import { plainToInstance } from 'class-transformer';
import { PairDto } from './pair.dto';

@Injectable()
export class PairService {
  constructor(private readonly dataSource: DataSource) {}

  async getPairList(userId: string, species: PET_SPECIES) {
    // 1. 페어 기본 정보 조회
    const pairs = await this.dataSource
      .createQueryBuilder(PairEntity, 'pairs')
      .where('pairs.ownerId = :userId AND pairs.species = :species', {
        userId,
        species,
      })
      .getMany();

    if (pairs.length === 0) return [];

    // 2. 펫 ID 수집 (중복 제거)
    const parentsPetIds = uniq(pairs.flatMap((p) => [p.fatherId, p.motherId]));

    // 3. 펫 정보 일괄 조회
    const pets = await this.dataSource
      .createQueryBuilder(PetEntity, 'p')
      .leftJoinAndMapOne(
        'p.petDetail',
        PetDetailEntity,
        'pd',
        'pd.petId = p.petId',
      )
      .where('p.petId IN (:...parentsPetIds)', { parentsPetIds })
      .select([
        'p.petId',
        'p.name',
        'p.species',
        'p.hatchingDate',
        'pd.sex',
        'pd.morphs',
        'pd.traits',
        'pd.weight',
        'pd.growth',
      ])
      .getMany();

    // 4. 메모리에서 조립
    const petMap = new Map(pets.map((pet) => [pet.petId, pet]));

    return pairs.map((pair) => {
      return plainToInstance(PairDto, {
        ...pair,
        father: petMap.get(pair.fatherId),
        mother: petMap.get(pair.motherId),
      });
    });
  }
}
