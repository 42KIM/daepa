import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PetEntity } from './pet.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { plainToInstance } from 'class-transformer';
import { CreatePetDto, PetAdoptionDto, PetDto, PetParentDto } from './pet.dto';
import { PET_GROWTH, PET_SEX } from './pet.constants';
import { ParentRequestService } from '../parent_request/parent_request.service';
import { PARENT_ROLE } from '../parent_request/parent_request.constants';
import { UserService } from '../user/user.service';
import { PetFilterDto } from './pet.dto';
import { PageDto, PageMetaDto } from 'src/common/page.dto';
import { UpdatePetDto } from './pet.dto';
import { AdoptionEntity } from '../adoption/adoption.entity';

@Injectable()
export class PetService {
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    private readonly parentRequestService: ParentRequestService,
    private readonly userService: UserService,
    @InjectRepository(AdoptionEntity)
    private readonly adoptionRepository: Repository<AdoptionEntity>,
  ) {}

  private async generateUniquePetId(): Promise<string> {
    let attempts = 0;
    while (attempts < this.MAX_RETRIES) {
      const petId = nanoid(8);
      const existingPet = await this.petRepository.findOne({
        where: { petId },
      });
      if (!existingPet) {
        return petId;
      }
      attempts++;
    }
    throw new HttpException(
      {
        statusCode: HttpStatus.CONFLICT,
        message:
          '펫 아이디 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.',
      },
      HttpStatus.CONFLICT,
    );
  }

  async createPet(
    createPetDto: CreatePetDto,
    ownerId: string,
  ): Promise<{ petId: string }> {
    const petId = await this.generateUniquePetId();
    const { father, mother, ...petData } = createPetDto;

    // 펫 데이터 준비
    const petEntityData = plainToInstance(PetEntity, {
      ...petData,
      petId,
      ownerId,
    });

    try {
      // 펫 생성
      await this.petRepository.insert(petEntityData);

      // 부모 연동 요청 처리
      if (father) {
        await this.handleParentRequest(petId, ownerId, father);
      }

      if (mother) {
        await this.handleParentRequest(petId, ownerId, mother);
      }

      return { petId };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        'message' in error
      ) {
        const dbError = error as { code: string; message: string };
        if (dbError.code === 'ER_DUP_ENTRY') {
          if (dbError.message.includes('UNIQUE_OWNER_PET_NAME')) {
            throw new HttpException(
              {
                statusCode: HttpStatus.CONFLICT,
                message: '이미 존재하는 펫 이름입니다.',
              },
              HttpStatus.CONFLICT,
            );
          }
        }
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '펫 생성 중 오류가 발생했습니다.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findPetByPetId(petId: string): Promise<PetDto> {
    const pet = await this.petRepository.findOne({
      where: { petId, isDeleted: false },
      relations: ['father', 'mother', 'adoption'],
    });

    if (!pet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // adoption 정보를 별도로 조회해보기
    const adoption = await this.adoptionRepository.findOne({
      where: { petId, isDeleted: false },
    });

    // 소유자 정보 조회
    const owner = await this.userService.findOneProfile(pet.ownerId);

    return plainToInstance(PetDto, {
      ...pet,
      owner,
      father: pet.father
        ? plainToInstance(PetParentDto, pet.father)
        : undefined,
      mother: pet.mother
        ? plainToInstance(PetParentDto, pet.mother)
        : undefined,
      adoption: adoption
        ? plainToInstance(PetAdoptionDto, adoption)
        : undefined,
    });
  }

  async updatePet(
    petId: string,
    updatePetDto: UpdatePetDto,
    userId: string,
  ): Promise<{ petId: string }> {
    // 펫 존재 여부 및 소유권 확인
    const existingPet = await this.petRepository.findOne({
      where: { petId, isDeleted: false },
    });

    if (!existingPet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (existingPet.ownerId !== userId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: '펫의 소유자가 아닙니다.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const { father, mother, ...petData } = updatePetDto;

    try {
      // 펫 정보 업데이트
      await this.petRepository.update({ petId }, petData);

      // 부모 연동 요청 처리
      if (father) {
        await this.handleParentRequest(petId, userId, father);
      }

      if (mother) {
        await this.handleParentRequest(petId, userId, mother);
      }

      return { petId };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        'message' in error
      ) {
        const dbError = error as { code: string; message: string };
        if (dbError.code === 'ER_DUP_ENTRY') {
          if (dbError.message.includes('UNIQUE_OWNER_PET_NAME')) {
            throw new HttpException(
              {
                statusCode: HttpStatus.CONFLICT,
                message: '이미 존재하는 펫 이름입니다.',
              },
              HttpStatus.CONFLICT,
            );
          }
        }
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '펫 수정 중 오류가 발생했습니다.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async handleParentRequest(
    childPetId: string,
    requesterId: string,
    parentInfo: { parentId: string; role: PARENT_ROLE; message?: string },
  ): Promise<void> {
    // 부모 펫 정보 조회
    const parentPet = await this.petRepository.findOne({
      where: { petId: parentInfo.parentId },
      select: ['petId', 'sex', 'ownerId', 'name'],
    });

    if (!parentPet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '부모로 지정된 펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // 성별 검증
    if (
      parentInfo.role === PARENT_ROLE.FATHER &&
      parentPet.sex !== PET_SEX.MALE
    ) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '아버지로 지정된 펫은 수컷이어야 합니다.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      parentInfo.role === PARENT_ROLE.MOTHER &&
      parentPet.sex !== PET_SEX.FEMALE
    ) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '어머니로 지정된 펫은 암컷이어야 합니다.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // 자신의 펫인 경우 즉시 연동
    if (parentPet.ownerId === requesterId) {
      await this.linkParentDirectly(
        childPetId,
        parentPet.petId,
        parentInfo.role,
      );
      return;
    }

    // 다른 사람의 펫인 경우 parent_request 테이블에 요청 생성
    await this.createParentRequest(
      childPetId,
      requesterId,
      parentPet,
      parentInfo,
    );
  }

  private async linkParentDirectly(
    childPetId: string,
    parentPetId: string,
    role: PARENT_ROLE,
  ): Promise<void> {
    // 펫 엔티티에 부모 정보 업데이트
    const updateData =
      role === PARENT_ROLE.FATHER
        ? { fatherId: parentPetId }
        : { motherId: parentPetId };

    await this.petRepository.update({ petId: childPetId }, updateData);
  }

  private async createParentRequest(
    childPetId: string,
    requesterId: string,
    parentPet: { petId: string; name: string; ownerId: string },
    parentInfo: { parentId: string; role: PARENT_ROLE; message?: string },
  ): Promise<void> {
    // 기존 대기 중인 요청이 있는지 확인
    const existingRequest =
      await this.parentRequestService.findPendingRequestByChildAndParent(
        childPetId,
        parentPet.petId,
        parentInfo.role,
      );

    if (existingRequest) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message: '이미 대기 중인 부모 연동 요청이 있습니다.',
        },
        HttpStatus.CONFLICT,
      );
    }

    // parent_request 테이블에 요청 생성 및 알림 발송
    await this.parentRequestService.createParentRequestWithNotification({
      requesterId,
      childPetId,
      parentPetId: parentPet.petId,
      role: parentInfo.role,
      message: parentInfo.message,
    });
  }

  async getPetListFull(
    pageOptionsDto: PetFilterDto,
    userId: string,
  ): Promise<PageDto<PetDto>> {
    const queryBuilder = this.petRepository
      .createQueryBuilder('pets')
      .leftJoinAndMapOne(
        'pets.owner',
        'users',
        'users',
        'users.userId = pets.ownerId',
      )
      .leftJoinAndMapOne(
        'pets.father',
        'pets',
        'father',
        'father.petId = pets.fatherId',
      )
      .leftJoinAndMapOne(
        'pets.mother',
        'pets',
        'mother',
        'mother.petId = pets.motherId',
      )
      .leftJoinAndMapOne(
        'pets.adoption',
        'adoptions',
        'adoptions',
        'adoptions.petId = pets.petId AND adoptions.isDeleted = false',
      )
      .where('pets.isDeleted = :isDeleted', { isDeleted: false });

    // 사용자 필터링
    if (pageOptionsDto.includeOthers !== false) {
      // 기본적으로 모든 공개된 펫과 자신의 펫을 조회
      queryBuilder.andWhere(
        '(pets.isPublic = :isPublic OR pets.ownerId = :userId)',
        { isPublic: true, userId },
      );
    } else {
      // 자신의 펫만 조회
      queryBuilder.andWhere('pets.ownerId = :userId', { userId });
    }

    // 키워드 검색
    if (pageOptionsDto.keyword) {
      queryBuilder.andWhere(
        '(pets.name LIKE :keyword OR pets.desc LIKE :keyword)',
        { keyword: `%${pageOptionsDto.keyword}%` },
      );
    }

    // 종 필터링
    if (pageOptionsDto.species) {
      queryBuilder.andWhere('pets.species = :species', {
        species: pageOptionsDto.species,
      });
    }

    // 성별 필터링
    if (pageOptionsDto.sex) {
      queryBuilder.andWhere('pets.sex = :sex', { sex: pageOptionsDto.sex });
    }

    // 소유자 필터링
    if (pageOptionsDto.ownerId) {
      queryBuilder.andWhere('pets.ownerId = :ownerId', {
        ownerId: pageOptionsDto.ownerId,
      });
    }

    // 공개 여부 필터링
    if (pageOptionsDto.isPublic !== undefined) {
      queryBuilder.andWhere('pets.isPublic = :isPublic', {
        isPublic: pageOptionsDto.isPublic,
      });
    }

    // 몸무게 범위 필터링
    if (pageOptionsDto.minWeight !== undefined) {
      queryBuilder.andWhere('pets.weight >= :minWeight', {
        minWeight: pageOptionsDto.minWeight,
      });
    }

    if (pageOptionsDto.maxWeight !== undefined) {
      queryBuilder.andWhere('pets.weight <= :maxWeight', {
        maxWeight: pageOptionsDto.maxWeight,
      });
    }

    // 생년월일 범위 필터링
    if (pageOptionsDto.minBirthdate !== undefined) {
      queryBuilder.andWhere('pets.hatchingDate >= :minBirthdate', {
        minBirthdate: pageOptionsDto.minBirthdate,
      });
    }

    if (pageOptionsDto.maxBirthdate !== undefined) {
      queryBuilder.andWhere('pets.hatchingDate <= :maxBirthdate', {
        maxBirthdate: pageOptionsDto.maxBirthdate,
      });
    }

    // 모프 필터링
    if (pageOptionsDto.morphs && pageOptionsDto.morphs.length > 0) {
      pageOptionsDto.morphs.forEach((morph, index) => {
        queryBuilder.andWhere(`JSON_CONTAINS(pets.morphs, :morph${index})`, {
          [`morph${index}`]: JSON.stringify(morph),
        });
      });
    }

    // 형질 필터링
    if (pageOptionsDto.traits && pageOptionsDto.traits.length > 0) {
      pageOptionsDto.traits.forEach((trait, index) => {
        queryBuilder.andWhere(`JSON_CONTAINS(pets.traits, :trait${index})`, {
          [`trait${index}`]: JSON.stringify(trait),
        });
      });
    }

    // 먹이 필터링
    if (pageOptionsDto.foods) {
      queryBuilder.andWhere(`JSON_CONTAINS(pets.foods, :food)`, {
        food: JSON.stringify(pageOptionsDto.foods),
      });
    }

    // 판매 상태 필터링
    if (pageOptionsDto.status) {
      queryBuilder.andWhere('adoptions.status = :status', {
        status: pageOptionsDto.status,
      });
    }

    // 성장단계 필터링
    if (pageOptionsDto.growth) {
      queryBuilder.andWhere('pets.growth = :growth', {
        growth: pageOptionsDto.growth,
      });
    }

    // 정렬 및 페이지네이션
    queryBuilder
      .orderBy('pets.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.itemPerPage);

    const totalCount = await queryBuilder.getCount();
    const petEntities = await queryBuilder.getMany();

    // PetDto로 변환
    const petDtos = await Promise.all(
      petEntities.map(async (pet) => {
        const owner = await this.userService.findOneProfile(pet.ownerId);

        let father: PetEntity | null = null;
        let mother: PetEntity | null = null;

        if (pet.fatherId) {
          father = await this.petRepository.findOne({
            where: { petId: pet.fatherId, isDeleted: false },
            select: [
              'petId',
              'name',
              'species',
              'morphs',
              'sex',
              'hatchingDate',
            ],
          });
        }

        if (pet.motherId) {
          mother = await this.petRepository.findOne({
            where: { petId: pet.motherId, isDeleted: false },
            select: [
              'petId',
              'name',
              'species',
              'morphs',
              'sex',
              'hatchingDate',
            ],
          });
        }

        return plainToInstance(PetDto, {
          ...pet,
          owner,
          father: father ? plainToInstance(PetParentDto, father) : undefined,
          mother: mother ? plainToInstance(PetParentDto, mother) : undefined,
        });
      }),
    );

    const pageMetaDto = new PageMetaDto({ totalCount, pageOptionsDto });
    return new PageDto(petDtos, pageMetaDto);
  }

  async unlinkParent(
    petId: string,
    parentRole: PARENT_ROLE,
    userId: string,
  ): Promise<{ petId: string }> {
    // 펫 존재 여부 및 소유권 확인
    const existingPet = await this.petRepository.findOne({
      where: { petId, isDeleted: false },
    });

    if (!existingPet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (existingPet.ownerId !== userId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: '펫의 소유자가 아닙니다.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // 부모 ID 확인
    const parentId =
      parentRole === PARENT_ROLE.FATHER
        ? existingPet.fatherId
        : existingPet.motherId;

    if (!parentId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '연동된 부모가 없습니다.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // 펫에서 부모 연동 제거
      const updateData =
        parentRole === PARENT_ROLE.FATHER
          ? { fatherId: undefined }
          : { motherId: undefined };

      await this.petRepository.update({ petId }, updateData);

      // parent_request 상태를 deleted로 변경
      await this.parentRequestService.deleteParentRequest(
        petId,
        parentId,
        parentRole,
      );

      return { petId };
    } catch {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '부모 연동 해제 중 오류가 발생했습니다.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async linkParent(
    petId: string,
    parentInfo: { parentId: string; role: PARENT_ROLE; message?: string },
    userId: string,
  ): Promise<{ petId: string }> {
    // 펫 존재 여부 및 소유권 확인
    const existingPet = await this.petRepository.findOne({
      where: { petId, isDeleted: false },
    });

    if (!existingPet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (existingPet.ownerId !== userId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: '펫의 소유자가 아닙니다.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // 이미 연동된 부모가 있는지 확인
    const existingParentId =
      parentInfo.role === PARENT_ROLE.FATHER
        ? existingPet.fatherId
        : existingPet.motherId;

    if (existingParentId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message: '이미 연동된 부모가 있습니다.',
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      // 부모 연동 요청 처리
      await this.handleParentRequest(petId, userId, parentInfo);

      return { petId };
    } catch {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '부모 연동 중 오류가 발생했습니다.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deletePet(petId: string, userId: string): Promise<{ petId: string }> {
    // 펫 존재 여부 및 소유권 확인
    const existingPet = await this.petRepository.findOne({
      where: { petId, isDeleted: false },
    });

    if (!existingPet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (existingPet.ownerId !== userId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: '펫의 소유자가 아닙니다.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // 연관된 데이터 확인 (분양 정보 등)
    const hasAdoption = await this.adoptionRepository.findOne({
      where: { petId, isDeleted: false },
    });

    if (hasAdoption) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '분양 정보가 있어 삭제할 수 없습니다.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // 자식 펫이 있는지 확인 (이 펫을 부모로 하는 펫들)
    const childrenPets = await this.petRepository.find({
      where: [
        { fatherId: petId, isDeleted: false },
        { motherId: petId, isDeleted: false },
      ],
    });

    if (childrenPets.length > 0) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '자식 펫이 있어 삭제할 수 없습니다.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.petRepository.update({ petId }, { isDeleted: true });

      // 연관된 parent_request들을 모두 삭제 상태로 변경
      await this.parentRequestService.deleteAllParentRequestsByPet(petId);

      return { petId };
    } catch {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '펫 삭제 중 오류가 발생했습니다.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async completeHatching(
    petId: string,
    userId: string,
    hatchingDate?: number | Date,
  ): Promise<{ petId: string }> {
    const existingPet = await this.petRepository.findOne({
      where: { petId, isDeleted: false },
    });

    if (!existingPet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '펫을 찾을 수 없습니다.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (existingPet.ownerId !== userId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: '펫의 소유자가 아닙니다.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // hatchingDate가 있으면 사용하고, 없으면 현재 시간으로 설정
    const finalHatchingDate = hatchingDate
      ? hatchingDate instanceof Date
        ? Number(hatchingDate.toISOString().slice(0, 10).replace(/-/g, ''))
        : hatchingDate
      : Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));

    await this.petRepository.update(
      { petId },
      {
        hatchingDate: finalHatchingDate,
        growth: PET_GROWTH.BABY,
      },
    );

    return { petId };
  }
}
