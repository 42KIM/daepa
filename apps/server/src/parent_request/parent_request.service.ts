import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ParentRequestEntity } from './parent_request.entity';
import {
  CreateParentRequestDto,
  UpdateParentRequestDto,
} from './parent_request.dto';
import { PARENT_STATUS, PARENT_ROLE } from './parent_request.constants';
import { PetEntity } from '../pet/pet.entity';
import { UserService } from '../user/user.service';
import { UserNotificationService } from '../user_notification/user_notification.service';
import { USER_NOTIFICATION_TYPE } from '../user_notification/user_notification.constant';

@Injectable()
export class ParentRequestService {
  constructor(
    @InjectRepository(ParentRequestEntity)
    private readonly parentRequestRepository: Repository<ParentRequestEntity>,
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    private readonly userService: UserService,
    private readonly userNotificationService: UserNotificationService,
  ) {}

  async createParentRequest(
    createParentRequestDto: CreateParentRequestDto,
  ): Promise<ParentRequestEntity> {
    const parentRequest = this.parentRequestRepository.create(
      createParentRequestDto,
    );
    return await this.parentRequestRepository.save(parentRequest);
  }

  async createParentRequestWithNotification(
    createParentRequestDto: CreateParentRequestDto,
  ): Promise<ParentRequestEntity> {
    // 요청자 정보 조회
    const requester = await this.userService.findOne({
      userId: createParentRequestDto.requesterId,
    });
    const requesterName = requester?.name || '요청자';

    // 자식 펫 정보 조회
    const childPet = await this.petRepository.findOne({
      where: { petId: createParentRequestDto.childPetId },
      select: ['name', 'ownerId'],
    });

    // 부모 펫 정보 조회
    const parentPet = await this.petRepository.findOne({
      where: { petId: createParentRequestDto.parentPetId },
      select: ['name', 'ownerId'],
    });

    if (!parentPet) {
      throw new HttpException(
        '부모 펫을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // parent_request 테이블에 요청 생성
    const parentRequest = await this.createParentRequest(
      createParentRequestDto,
    );

    // 알림 생성
    await this.userNotificationService.createUserNotification(
      createParentRequestDto.requesterId,
      {
        receiverId: parentPet.ownerId,
        type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
        targetId: createParentRequestDto.childPetId,
        detailJson: {
          childPetId: createParentRequestDto.childPetId,
          childPetName: childPet?.name || 'Unknown',
          requesterId: createParentRequestDto.requesterId,
          requesterName,
          parentPetId: createParentRequestDto.parentPetId,
          parentPetName: parentPet.name,
          role: createParentRequestDto.role,
          message: createParentRequestDto.message,
        },
      },
    );

    return parentRequest;
  }

  async findPendingRequestByChildAndParent(
    childPetId: string,
    parentPetId: string,
    role: PARENT_ROLE,
  ): Promise<ParentRequestEntity | null> {
    return await this.parentRequestRepository.findOne({
      where: {
        childPetId,
        parentPetId,
        role,
        status: PARENT_STATUS.PENDING,
      },
    });
  }

  async findById(id: number): Promise<ParentRequestEntity | null> {
    return await this.parentRequestRepository.findOne({
      where: { id },
    });
  }

  async updateParentRequest(
    id: number,
    updateParentRequestDto: UpdateParentRequestDto,
  ): Promise<ParentRequestEntity> {
    await this.parentRequestRepository.update(id, updateParentRequestDto);
    const updated = await this.findById(id);
    if (!updated) {
      throw new HttpException(
        '부모 요청을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }
    return updated;
  }

  async approveParentRequest(
    id: number,
    requesterId: string,
  ): Promise<ParentRequestEntity> {
    const parentRequest = await this.findById(id);
    if (!parentRequest) {
      throw new HttpException(
        '부모 요청을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (parentRequest.requesterId !== requesterId) {
      throw new HttpException('승인 권한이 없습니다.', HttpStatus.FORBIDDEN);
    }

    return await this.updateParentRequest(id, {
      status: PARENT_STATUS.APPROVED,
    });
  }

  async rejectParentRequest(
    id: number,
    requesterId: string,
    rejectReason?: string,
  ): Promise<ParentRequestEntity> {
    const parentRequest = await this.findById(id);
    if (!parentRequest) {
      throw new HttpException(
        '부모 요청을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (parentRequest.requesterId !== requesterId) {
      throw new HttpException('취소 권한이 없습니다.', HttpStatus.FORBIDDEN);
    }

    return await this.updateParentRequest(id, {
      status: PARENT_STATUS.REJECTED,
      rejectReason,
    });
  }

  async cancelParentRequest(
    id: number,
    requesterId: string,
  ): Promise<ParentRequestEntity> {
    const parentRequest = await this.findById(id);
    if (!parentRequest) {
      throw new HttpException(
        '부모 요청을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (parentRequest.requesterId !== requesterId) {
      throw new HttpException('취소 권한이 없습니다.', HttpStatus.FORBIDDEN);
    }

    return await this.updateParentRequest(id, {
      status: PARENT_STATUS.CANCELLED,
    });
  }

  async findPendingRequestsByReceiverId(
    receiverId: string,
  ): Promise<ParentRequestEntity[]> {
    return await this.parentRequestRepository
      .createQueryBuilder('parentRequest')
      .leftJoin('parentRequest.parentPet', 'parentPet')
      .where('parentPet.ownerId = :receiverId', { receiverId })
      .andWhere('parentRequest.status = :status', {
        status: PARENT_STATUS.PENDING,
      })
      .orderBy('parentRequest.createdAt', 'DESC')
      .getMany();
  }

  async findRequestsByRequesterId(
    requesterId: string,
  ): Promise<ParentRequestEntity[]> {
    return await this.parentRequestRepository.find({
      where: { requesterId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteParentRequest(
    childPetId: string,
    parentPetId: string,
    role: PARENT_ROLE,
  ): Promise<void> {
    const parentRequest = await this.parentRequestRepository.findOne({
      where: {
        childPetId,
        parentPetId,
        role,
      },
    });

    if (parentRequest) {
      await this.parentRequestRepository.update(
        { id: parentRequest.id },
        { status: PARENT_STATUS.DELETED },
      );
    }
  }

  async deleteAllParentRequestsByPet(petId: string): Promise<void> {
    // 해당 펫과 관련된 모든 parent_request를 DELETED 상태로 변경
    await this.parentRequestRepository.update(
      {
        childPetId: petId,
        status: Not(PARENT_STATUS.DELETED), // 이미 삭제된 것 제외
      },
      { status: PARENT_STATUS.DELETED },
    );

    // 해당 펫이 부모인 경우도 처리
    await this.parentRequestRepository.update(
      {
        parentPetId: petId,
        status: Not(PARENT_STATUS.DELETED),
      },
      { status: PARENT_STATUS.DELETED },
    );
  }
}
