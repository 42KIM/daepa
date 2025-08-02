import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource } from 'typeorm';
import { PairEntity } from './pair.entity';
import { CreatePairDto } from './pair.dto';
import { PetEntity } from 'src/pet/pet.entity';

@Injectable()
export class PairService {
  constructor(
    @InjectRepository(PairEntity)
    private readonly pairRepository: Repository<PairEntity>,
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createPair(createPairDto: CreatePairDto) {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const { fatherId, motherId, ownerId } = createPairDto;
      if (!ownerId) {
        throw new BadRequestException('등록 시 주인 아이디가 필요합니다.');
      }
      if (!fatherId && !motherId) {
        throw new BadRequestException(
          '등록하려면 최소 한 마리의 부모 정보가 필요합니다.',
        );
      }

      // 부모 펫 존재 여부를 병렬로 확인 (성능 향상)
      const [fatherExists, motherExists] = await Promise.all([
        fatherId
          ? entityManager.existsBy(PetEntity, { petId: fatherId })
          : Promise.resolve(false),
        motherId
          ? entityManager.existsBy(PetEntity, { petId: motherId })
          : Promise.resolve(false),
      ]);

      if (fatherId && !fatherExists) {
        throw new BadRequestException(
          '등록하려는 개체의 부모 정보가 존재하지 않습니다.',
        );
      }
      if (motherId && !motherExists) {
        throw new BadRequestException(
          '등록하려는 개체의 부모 정보가 존재하지 않습니다.',
        );
      }

      // 이미 존재하는 펫 쌍인지 확인
      const existingPair = await entityManager.existsBy(PairEntity, {
        ownerId,
        fatherId,
        motherId,
      });
      if (existingPair) {
        throw new BadRequestException('이미 존재하는 펫 쌍입니다.');
      }

      const pair = entityManager.create(PairEntity, createPairDto);
      return await entityManager.save(PairEntity, pair);
    });
  }
}
