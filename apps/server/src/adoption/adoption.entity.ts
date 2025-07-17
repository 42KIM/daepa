import { Exclude, Expose } from 'class-transformer';
import { ADOPTION_SALE_STATUS } from 'src/pet/pet.constants';
import { PetEntity } from 'src/pet/pet.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';

@Entity({ name: 'adoptions' })
@Index('UNIQUE_ADOPTION_ID', ['adoptionId'], { unique: true })
export class AdoptionEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  adoptionId: string;

  @Column()
  petId: string;

  @Column({ nullable: true })
  price?: number; // 가격

  @Expose({ name: 'adoptionDate' })
  @Column({ type: 'date', nullable: true })
  adoptionDate?: Date; // 분양 날짜

  @Column()
  sellerId: string; // 분양자 ID

  @Column({ nullable: true })
  buyerId?: string; // 입양자 ID

  @Column({ type: 'text', nullable: true })
  memo?: string; // 메모

  @Column({ type: 'varchar', length: 200, nullable: true })
  location?: string; // 거래 장소

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'enum', enum: ADOPTION_SALE_STATUS, nullable: true })
  status?: ADOPTION_SALE_STATUS;

  @OneToOne(() => PetEntity, (pet) => pet.adoption)
  pet: PetEntity;

  @OneToOne(() => UserEntity, (user) => user.adoption)
  seller: UserEntity;

  @OneToOne(() => UserEntity, (user) => user.adoption)
  buyer: UserEntity;
}
