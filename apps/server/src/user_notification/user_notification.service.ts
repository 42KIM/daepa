import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserNotificationEntity } from './user_notification.entity';
import { DeleteResult, EntityManager, Repository, UpdateResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from 'src/common/page.dto';
import {
  CreateUserNotificationDto,
  DeleteUserNotificationDto,
  UpdateUserNotificationDto,
  UserNotificationDto,
} from './user_notification.dto';
import { plainToInstance } from 'class-transformer';
import { USER_NOTIFICATION_STATUS } from './user_notification.constant';

@Injectable()
export class UserNotificationService {
  constructor(
    @InjectRepository(UserNotificationEntity)
    private readonly userNotificationRepository: Repository<UserNotificationEntity>,
  ) {}

  async createUserNotification(
    entityManager: EntityManager,
    senderId: string,
    dto: CreateUserNotificationDto,
  ): Promise<UserNotificationEntity> {
    const userNotificationEntity = plainToInstance(UserNotificationEntity, {
      ...dto,
      senderId,
    });
    return await entityManager.save(
      UserNotificationEntity,
      userNotificationEntity,
    );
  }

  async getNotificationList(
    dto: PageOptionsDto,
    userId: string,
  ): Promise<PageDto<UserNotificationEntity>> {
    const queryBuilder =
      this.userNotificationRepository.createQueryBuilder('userNotification');

    queryBuilder
      .where(
        'userNotification.receiverId = :userId AND userNotification.isDeleted = :isDeleted',
        {
          userId,
          isDeleted: false,
        },
      )
      .orderBy('userNotification.createdAt', dto.order)
      .skip(dto.skip)
      .take(dto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto: dto });

    return new PageDto(entities, pageMetaDto);
  }

  async updateUserNotification(
    dto: UpdateUserNotificationDto,
  ): Promise<UpdateResult> {
    if (!dto.status) {
      throw new BadRequestException('Status is required');
    }
    const userNotificationEntity =
      await this.userNotificationRepository.existsBy({ id: dto.id });
    if (!userNotificationEntity) {
      throw new NotFoundException('User notification not found');
    }
    return await this.userNotificationRepository.update(
      { id: dto.id },
      { status: dto.status },
    );
  }

  async deleteUserNotification(
    dto: DeleteUserNotificationDto,
    userId: string,
  ): Promise<DeleteResult> {
    if (dto.receiverId !== userId) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    return await this.userNotificationRepository.update(
      { id: dto.id, receiverId: dto.receiverId, isDeleted: false },
      { isDeleted: true },
    );
  }

  async findOne(
    id: number,
    userId: string,
  ): Promise<UserNotificationDto | null> {
    const userNotificationEntity =
      await this.userNotificationRepository.findOne({
        where: { id, receiverId: userId, isDeleted: false },
      });

    if (!userNotificationEntity) {
      return null;
    }

    return plainToInstance(UserNotificationDto, userNotificationEntity);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.userNotificationRepository.count({
      where: {
        receiverId: userId,
        status: USER_NOTIFICATION_STATUS.UNREAD,
        isDeleted: false,
      },
    });
  }
}
