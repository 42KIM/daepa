import { Injectable } from '@nestjs/common';
import { ParentEntity } from './parent.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateParentDto,
  DeleteParentDto,
  UpdateParentDto,
} from './parent.dto';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(ParentEntity)
    private readonly parentRepository: Repository<ParentEntity>,
  ) {}

  async createParent(petId: string, createParentDto: CreateParentDto) {
    // TODO: parent 성별 검증
    return await this.parentRepository.insert({
      pet_id: petId,
      parent_id: createParentDto.parentId,
      role: createParentDto.role,
    });
  }

  async updateParentStatus(petId: string, updateParentDto: UpdateParentDto) {
    return await this.parentRepository.update(
      {
        pet_id: petId,
        parent_id: updateParentDto.parentId,
      },
      {
        status: updateParentDto.updateStatus,
      },
    );
  }
  async deleteParent(petId: string, deleteParentDto: DeleteParentDto) {
    return await this.parentRepository.update(
      {
        pet_id: petId,
        parent_id: deleteParentDto.parentId,
      },
      {
        status: 'deleted',
      },
    );
  }
}
