import { Injectable } from '@nestjs/common';
import { LayingEntity } from './laying.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLayingDto } from './laying.dto';
import { isMySQLError } from 'src/common/error';

@Injectable()
export class LayingService {
  constructor(
    @InjectRepository(LayingEntity)
    private readonly layingRepository: Repository<LayingEntity>,
  ) {}

  async createLaying(createLayingDto: CreateLayingDto) {
    let retries = 5;

    // incrementedLayingOrder 생성 시의 동시성 문제 해결 목적
    while (retries > 0) {
      try {
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
      } catch (error) {
        if (
          isMySQLError(error) &&
          error.code === 'ER_DUP_ENTRY' &&
          retries > 1
        ) {
          retries--;
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }
        throw error;
      }
    }
  }
}
