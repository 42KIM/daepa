import { Injectable } from '@nestjs/common';
import { LayingEntity } from './laying.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLayingDto } from './laying.dto';

@Injectable()
export class LayingService {
  constructor(
    @InjectRepository(LayingEntity)
    private readonly layingRepository: Repository<LayingEntity>,
  ) {}

  async createLaying(createLayingDto: CreateLayingDto) {
    const clutchEggs = await this.layingRepository.countBy({
      matingId: createLayingDto.matingId,
      layingDate: createLayingDto.layingDate,
    });

    const incrementedLayingOrder = clutchEggs + 1;

    const layingEntity = this.layingRepository.create({
      ...createLayingDto,
      layingOrder: incrementedLayingOrder,
    });
    return await this.layingRepository.save(layingEntity);
  }
}
