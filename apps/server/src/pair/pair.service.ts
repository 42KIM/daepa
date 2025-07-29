import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async createPair(createPairDto: CreatePairDto): Promise<PairEntity> {
    const { fatherId, motherId, ownerId } = createPairDto;
    if (!ownerId) {
      throw new BadRequestException('등록 시 주인 아이디가 필요합니다.');
    }
    if (!fatherId || !motherId) {
      throw new BadRequestException(
        '등록하려면 최소 한 마리의 부모 정보가 필요합니다.',
      );
    }
    if (fatherId) {
      const father = await this.petRepository.findOne({
        where: { petId: fatherId },
      });
      if (!father) {
        throw new BadRequestException(
          '등록하려는 개체의 부모 정보가 존재하지 않습니다.',
        );
      }
    }
    if (motherId) {
      const mother = await this.petRepository.findOne({
        where: { petId: motherId },
      });

      if (!mother) {
        throw new BadRequestException(
          '등록하려는 개체의 부모 정보가 존재하지 않습니다.',
        );
      }
    }

    // 이미 존재하는 펫 쌍인지 확인
    const existingPair = await this.pairRepository.findOne({
      where: {
        ownerId: ownerId,
        fatherId: fatherId,
        motherId: motherId,
      },
    });
    if (existingPair) {
      throw new BadRequestException('이미 존재하는 펫 쌍입니다.');
    }

    const pair = this.pairRepository.create(createPairDto);
    return await this.pairRepository.save(pair);
  }
}
