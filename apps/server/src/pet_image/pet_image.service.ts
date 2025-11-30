import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PetImageEntity } from './pet_image.entity';
import { EntityManager, Repository, DataSource } from 'typeorm';
import { PetImageItem, UpsertPetImageDto } from './pet_image.dto';
import { R2Service } from 'src/common/cloudflare/r2.service';
import { InjectRepository } from '@nestjs/typeorm';
import { PetEntity } from '../pet/pet.entity';

@Injectable()
export class PetImageService {
  constructor(
    private readonly r2Service: R2Service,
    @InjectRepository(PetImageEntity)
    private readonly petImageRepository: Repository<PetImageEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findOneByPetId(petId: string): Promise<PetImageItem[]> {
    const petImage = await this.petImageRepository.findOne({
      where: { petId },
    });

    return petImage?.files ?? [];
  }

  async findThumbnailByPetId(petId: string): Promise<PetImageItem | null> {
    const petImage = await this.petImageRepository.findOne({
      where: { petId },
    });

    if (petImage?.files && petImage.files.length > 0) {
      return petImage.files[0];
    }

    return null;
  }

  async saveAndUploadConfirmedImages(
    petId: string,
    imageList: UpsertPetImageDto[],
    userId: string,
    type: 'create' | 'update',
    manager?: EntityManager,
  ) {
    const run = async (em: EntityManager) => {
      if (!['create', 'update'].includes(type)) {
        throw new ForbiddenException('잘못된 요청입니다.');
      }

      if (type === 'update') {
        const pet = await em.findOne(PetEntity, {
          where: { petId, isDeleted: false },
        });

        if (!pet) {
          throw new NotFoundException('펫을 찾을 수 없습니다.');
        }

        if (pet.ownerId !== userId) {
          throw new ForbiddenException('펫의 소유자가 아닙니다.');
        }
      }

      // 원본 순서를 유지하면서 인덱스와 상태를 추적
      const imageWithIndexAndStatus = imageList.map((image, index) => ({
        index,
        originalImage: image,
        isPending: image.fileName.startsWith('PENDING/'),
      }));

      // pending 이미지만 필터링하여 병렬 처리
      const pendingImages = imageWithIndexAndStatus.filter(
        (item) => item.isPending,
      );

      // 병렬로 R2 업로드 처리
      const uploadResults = await Promise.all(
        pendingImages.map(async (item) => ({
          index: item.index,
          result: await this.r2Service.updateFileKey(
            item.originalImage.fileName,
            item.originalImage.fileName.replace('PENDING/', `${petId}/`),
          ),
        })),
      );

      // 업로드 결과를 Map으로 변환 (빠른 조회)
      const uploadResultMap = new Map(
        uploadResults.map((ur) => [ur.index, ur.result]),
      );

      // 원본 순서대로 최종 배열 구성
      const savedImageList: PetImageItem[] = imageWithIndexAndStatus.map(
        (item) => {
          if (item.isPending) {
            const uploadResult = uploadResultMap.get(item.index);
            return {
              fileName: uploadResult!.fileName,
              url: uploadResult!.url,
              mimeType: item.originalImage.mimeType,
              size: item.originalImage.size,
            };
          } else {
            return {
              fileName: item.originalImage.fileName,
              url: item.originalImage.url,
              mimeType: item.originalImage.mimeType,
              size: item.originalImage.size,
            };
          }
        },
      );

      if (savedImageList.length === 0) {
        return em.delete(PetImageEntity, { petId });
      }

      return em.upsert(
        PetImageEntity,
        {
          petId,
          files: savedImageList,
        },
        {
          conflictPaths: {
            petId: true,
          },
          skipUpdateIfNoValuesChanged: true,
        },
      );
    };

    if (manager) {
      return run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return run(entityManager);
    });
  }
}
