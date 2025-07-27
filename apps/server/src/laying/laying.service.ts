import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LayingEntity } from './laying.entity';
import { CreateLayingDto } from './laying.dto';

@Injectable()
export class LayingService {
  constructor(
    @InjectRepository(LayingEntity)
    private readonly layingRepository: Repository<LayingEntity>,
  ) {}

  async createLaying(createLayingDto: CreateLayingDto): Promise<LayingEntity> {
    const exists = await this.layingRepository.findOne({
      where: {
        matingId: createLayingDto.matingId,
        layingDate: createLayingDto.layingDate,
      },
    });
    if (exists) {
      throw new BadRequestException('이미 해당 날짜에 산란 정보가 존재합니다.');
    }

    const laying = this.layingRepository.create(createLayingDto);
    return await this.layingRepository.save(laying);
  }
}
