import { Injectable } from '@nestjs/common';
import { PetImageEntity } from './pet_image.entity';
import { EntityManager, Repository, DataSource } from 'typeorm';
import { PetImageItem, UpsertPetImageDto } from './pet_image.dto';
import { R2Service } from 'src/common/cloudflare/r2.service';
import { InjectRepository } from '@nestjs/typeorm';

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
    manager?: EntityManager,
  ) {
    const run = async (em: EntityManager) => {
      const needUploadImageList: PetImageItem[] = [];
      const savedImageList: PetImageItem[] = [];

      for (const image of imageList) {
        if (image.fileName.startsWith('PENDING/')) {
          needUploadImageList.push({
            fileName: image.fileName,
            url: image.url,
            mimeType: image.mimeType,
            size: image.size,
          });
        } else {
          savedImageList.push({
            fileName: image.fileName,
            url: image.url,
            mimeType: image.mimeType,
            size: image.size,
          });
        }
      }

      for (const image of needUploadImageList) {
        const { fileName, url } = await this.r2Service.updateFileKey(
          image.fileName,
          image.fileName.replace('PENDING/', `${petId}/`),
        );
        savedImageList.push({
          fileName: fileName,
          url: url,
          mimeType: image.mimeType,
          size: image.size,
        });
      }

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
            id: true,
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
