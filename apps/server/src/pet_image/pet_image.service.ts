import { Injectable } from '@nestjs/common';
import { PetImageEntity } from './pet_image.entity';
import { Repository } from 'typeorm';
import { CreatePetImageDto } from './pet_image.dto';

@Injectable()
export class PetImageService {
  constructor(
    private readonly petImageRepository: Repository<PetImageEntity>,
  ) {}

  async save(petImage: CreatePetImageDto) {
    return this.petImageRepository.save(petImage);
  }

  async saveList(petImages: CreatePetImageDto[]) {
    return this.petImageRepository.save(petImages);
  }
}
