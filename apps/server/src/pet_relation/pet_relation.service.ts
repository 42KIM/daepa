import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { PetRelationEntity } from './pet_relation.entity';
import { PARENT_ROLE } from '../parent_request/parent_request.constants';

@Injectable()
export class PetRelationService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 펫의 부모 관계 정보를 업데이트합니다 (Upsert)
   * @param petId - 자식 펫 ID
   * @param role - 부모 역할 (FATHER | MOTHER)
   * @param parentPetId - 부모 펫 ID
   * @param manager - 선택적 EntityManager (외부 트랜잭션 지원)
   */
  async upsertParentRelation(
    petId: string,
    role: PARENT_ROLE,
    parentPetId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const run = async (em: EntityManager) => {
      // 기존 레코드 조회
      const existing = await em.findOne(PetRelationEntity, {
        where: { petId },
      });

      if (existing) {
        // UPDATE: 기존 레코드의 father_id 또는 mother_id만 업데이트
        const updateData: Partial<PetRelationEntity> = {};
        if (role === PARENT_ROLE.FATHER) {
          updateData.fatherId = parentPetId;
        } else if (role === PARENT_ROLE.MOTHER) {
          updateData.motherId = parentPetId;
        }

        await em.update(PetRelationEntity, { petId }, updateData);
      } else {
        // INSERT: 새 레코드 생성
        const newRelation: Partial<PetRelationEntity> = {
          petId,
          fatherId: role === PARENT_ROLE.FATHER ? parentPetId : null,
          motherId: role === PARENT_ROLE.MOTHER ? parentPetId : null,
        };

        await em.save(PetRelationEntity, newRelation);
      }
    };

    if (manager) {
      await run(manager);
      return;
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      await run(entityManager);
    });
  }

  /**
   * 펫의 부모 관계 정보를 조회합니다
   * @param petId - 펫 ID
   * @param manager - 선택적 EntityManager
   */
  async getPetRelation(
    petId: string,
    manager?: EntityManager,
  ): Promise<PetRelationEntity | null> {
    const run = async (em: EntityManager) => {
      return em.findOne(PetRelationEntity, {
        where: { petId },
      });
    };

    if (manager) {
      return run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return run(entityManager);
    });
  }

  /**
   * 펫의 특정 부모 관계를 제거합니다 (NULL로 설정)
   * @param petId - 자식 펫 ID
   * @param role - 제거할 부모 역할 (FATHER | MOTHER)
   * @param manager - 선택적 EntityManager (외부 트랜잭션 지원)
   */
  async removeParentRelation(
    petId: string,
    role: PARENT_ROLE,
    manager?: EntityManager,
  ): Promise<void> {
    const run = async (em: EntityManager) => {
      // 기존 레코드 조회
      const existing = await em.findOne(PetRelationEntity, {
        where: { petId },
      });

      if (existing) {
        // UPDATE: 해당 role의 부모 ID를 NULL로 설정
        const updateData: Partial<PetRelationEntity> = {};
        if (role === PARENT_ROLE.FATHER) {
          updateData.fatherId = null;
        } else if (role === PARENT_ROLE.MOTHER) {
          updateData.motherId = null;
        }

        await em.update(PetRelationEntity, { petId }, updateData);
      }
      // 레코드가 없으면 아무 작업도 하지 않음
    };

    if (manager) {
      await run(manager);
      return;
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      await run(entityManager);
    });
  }

  /**
   * 같은 부모를 가진 모든 자식 펫 ID 조회
   * @param fatherId - 부 펫 ID
   * @param motherId - 모 펫 ID
   * @param manager - 선택적 EntityManager
   */
  async getSiblingPetIds(
    fatherId: string,
    motherId: string,
    manager?: EntityManager,
  ): Promise<string[]> {
    const run = async (em: EntityManager) => {
      const relations = await em.find(PetRelationEntity, {
        where: { fatherId, motherId },
        select: ['petId'],
      });

      return relations.map((r) => r.petId);
    };

    if (manager) {
      return run(manager);
    }

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      return run(entityManager);
    });
  }
}
