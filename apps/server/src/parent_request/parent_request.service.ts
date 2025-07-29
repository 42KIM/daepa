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
    // 부모 펫 엔티티 조회
    const parentPet = await this.petRepository.findOne({
      where: { petId: createParentRequestDto.parentPetId },
    });

    if (!parentPet) {
      throw new HttpException(
        '부모 펫을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    const parentRequest = this.parentRequestRepository.create({
      requesterId: createParentRequestDto.requesterId,
      childPetId: createParentRequestDto.childPetId,
      parentPetId: createParentRequestDto.parentPetId,
      role: createParentRequestDto.role,
      status: PARENT_STATUS.PENDING,
      message: createParentRequestDto.message,
    });

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

  async findPendingRequestByChildAndRole(
    childPetId: string,
    role: PARENT_ROLE,
  ): Promise<ParentRequestEntity | null> {
    return await this.parentRequestRepository.findOne({
      where: {
        childPetId,
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
    // 기존 요청 조회
    const existingRequest = await this.findById(id);

    if (!existingRequest) {
      throw new HttpException(
        '부모 요청을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 상태 업데이트
    await this.parentRequestRepository.update(id, updateParentRequestDto);
    const updated = await this.findById(id);
    if (!updated) {
      throw new HttpException(
        '부모 요청을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 상태가 변경된 경우에만 알림 처리
    if (existingRequest.status !== updateParentRequestDto.status) {
      await this.handleStatusChangeNotification(updated);
    }

    return updated;
  }

  private async handleStatusChangeNotification(
    parentRequest: ParentRequestEntity,
  ): Promise<void> {
    // 펫 정보 조회
    const childPet = await this.petRepository.findOne({
      where: { petId: parentRequest.childPetId },
      select: ['name', 'ownerId'],
    });

    const parentPet = await this.petRepository.findOne({
      where: { petId: parentRequest.parentPetId },
      select: ['name', 'ownerId'],
    });
    console.log(
      '🚀 ~ ParentRequestService ~ handleStatusChangeNotification ~ parentPet:',
      { parentPet, childPet, parentRequest },
    );

    if (!childPet || !parentPet) {
      throw new HttpException(
        '펫 정보를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 요청자에게 알림 보내기
    const notificationType = this.getNotificationTypeByStatus(
      parentRequest.status,
    );

    const message = this.getStatusChangeMessage(
      parentRequest.status,
      parentRequest.role,
    );

    // 기존 알림 업데이트 (요청자에게 보낸 알림)
    await this.userNotificationService.updateWhere(
      {
        targetId: parentRequest.childPetId,
        senderId: parentRequest.requesterId,
        type: USER_NOTIFICATION_TYPE.PARENT_REQUEST,
      },
      {
        type: notificationType,
        detailJson: {
          childPetId: parentRequest.childPetId,
          childPetName: childPet.name,
          parentPetId: parentRequest.parentPetId,
          parentPetName: parentPet.name,
          requesterId: parentRequest.requesterId,
          role: parentRequest.role,
          status: parentRequest.status,
          message,
        },
      },
    );

    try {
      await this.userNotificationService.createUserNotification(
        parentPet.ownerId, // 부모 펫 소유자가 발신자
        {
          receiverId: parentRequest.requesterId, // 요청자가 수신자
          type: notificationType,
          targetId: parentRequest.childPetId,
          detailJson: {
            childPetId: parentRequest.childPetId,
            childPetName: childPet.name,
            parentPetId: parentRequest.parentPetId,
            parentPetName: parentPet.name,
            role: parentRequest.role,
            status: parentRequest.status,
            message,
          },
        },
      );
    } catch (error) {
      console.log(
        '🚀 ~ ParentRequestService ~ handleStatusChangeNotification ~ error:',
        error,
      );
    }
    // 새로운 알림 생성 (요청자에게 결과 알림)
  }

  private getNotificationTypeByStatus(
    status: PARENT_STATUS,
  ): USER_NOTIFICATION_TYPE {
    switch (status) {
      case PARENT_STATUS.APPROVED:
        return USER_NOTIFICATION_TYPE.PARENT_ACCEPT;
      case PARENT_STATUS.REJECTED:
        return USER_NOTIFICATION_TYPE.PARENT_REJECT;
      case PARENT_STATUS.CANCELLED:
        return USER_NOTIFICATION_TYPE.PARENT_REJECT; // CANCEL 타입이 없으므로 REJECT 사용
      default:
        return USER_NOTIFICATION_TYPE.PARENT_REQUEST;
    }
  }

  private getStatusChangeMessage(
    status: PARENT_STATUS,
    role: PARENT_ROLE,
  ): string {
    const roleText = role === PARENT_ROLE.FATHER ? '아버지' : '어머니';

    switch (status) {
      case PARENT_STATUS.APPROVED:
        return `${roleText} 연동 요청이 수락되었습니다.`;
      case PARENT_STATUS.REJECTED:
        return `${roleText} 연동 요청이 거절되었습니다.`;
      case PARENT_STATUS.CANCELLED:
        return `${roleText} 연동 요청이 취소되었습니다.`;
      default:
        return `${roleText} 연동 요청이 처리되었습니다.`;
    }
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
    // 부모 펫의 소유자 ID로 필터링하기 위해 서브쿼리 사용
    const subQuery = this.petRepository
      .createQueryBuilder('pet')
      .select('pet.petId')
      .where('pet.ownerId = :receiverId', { receiverId });

    return await this.parentRequestRepository
      .createQueryBuilder('parentRequest')
      .where('parentRequest.parentPetId IN (' + subQuery.getQuery() + ')')
      .andWhere('parentRequest.status = :status', {
        status: PARENT_STATUS.PENDING,
      })
      .setParameters({ receiverId })
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

  async updateParentRequestByNotificationId(
    userId: string,
    notificationId: number,
    updateParentRequestDto: UpdateParentRequestDto,
  ) {
    const notification = await this.userNotificationService.findOne(
      notificationId,
      userId,
    );

    if (!notification) {
      throw new HttpException('알림을 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }

    const parentRequest = await this.parentRequestRepository.findOne({
      where: {
        requesterId: notification.senderId,
        childPetId: notification.targetId,
        role: notification.detailJson.role as PARENT_ROLE,
      },
    });

    if (!parentRequest) {
      throw new HttpException(
        '부모 요청을 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.updateParentRequest(parentRequest.id, updateParentRequestDto);
  }
}
