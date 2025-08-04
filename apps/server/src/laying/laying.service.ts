import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LayingEntity } from './laying.entity';
import { CreateLayingDto, UpdateLayingDto } from './laying.dto';
import { PetService } from '../pet/pet.service';
import { CreatePetDto } from '../pet/pet.dto';
import { PET_GROWTH } from 'src/pet/pet.constants';
import { PARENT_ROLE } from 'src/parent_request/parent_request.constants';

@Injectable()
export class LayingService {
  constructor(
    @InjectRepository(LayingEntity)
    private readonly layingRepository: Repository<LayingEntity>,
    private readonly petService: PetService,
  ) {}

  async createLaying(
    createLayingDto: CreateLayingDto,
    ownerId: string,
  ): Promise<LayingEntity> {
    const exists = await this.layingRepository.existsBy({
      matingId: createLayingDto.matingId,
      layingDate: createLayingDto.layingDate,
    });
    if (exists) {
      throw new BadRequestException('이미 해당 날짜에 산란 정보가 존재합니다.');
    }

    // 산란 정보 생성
    const layingEntity = this.layingRepository.create(createLayingDto);
    const savedLaying = await this.layingRepository.save(layingEntity);

    // clutchCount만큼 펫 생성
    if (createLayingDto.clutchCount && createLayingDto.clutchCount > 0) {
      const { clutchCount, temperature, species } = createLayingDto;

      for (let i = 0; i < clutchCount; i++) {
        const createPetDto: CreatePetDto = {
          species,
          temperature,
          layingId: savedLaying.id,
          clutchOrder: i + 1,
          growth: PET_GROWTH.EGG,
          ...(createLayingDto.motherId && {
            mother: {
              parentId: createLayingDto.motherId,
              role: PARENT_ROLE.MOTHER,
            },
          }),
          ...(createLayingDto.fatherId && {
            father: {
              parentId: createLayingDto.fatherId,
              role: PARENT_ROLE.FATHER,
            },
          }),
        };

        await this.petService.createPet(createPetDto, ownerId);
      }
    }

    return savedLaying;
  }

  async updateLaying(id: number, updateLayingDto: UpdateLayingDto) {
    const laying = await this.layingRepository.existsBy({
      id,
    });

    if (!laying) {
      throw new NotFoundException('산란 정보를 찾을 수 없습니다.');
    }

    return this.layingRepository.update(id, updateLayingDto);
  }
}
