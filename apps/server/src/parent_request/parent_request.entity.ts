import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PARENT_ROLE, PARENT_STATUS } from './parent_request.constants';
import { PetEntity } from '../pet/pet.entity';

@Entity({ name: 'parent_requests' })
export class ParentRequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requesterId: string;

  @Column()
  childPetId: string;

  @Column()
  parentPetId: string;

  @ManyToOne(() => PetEntity, { nullable: false })
  @JoinColumn({ name: 'parentPetId' })
  parentPet: PetEntity;

  @Column({
    type: 'enum',
    enum: PARENT_ROLE,
  })
  role: PARENT_ROLE;

  @Column({
    type: 'enum',
    enum: PARENT_STATUS,
    default: PARENT_STATUS.PENDING,
    nullable: true,
  })
  status: PARENT_STATUS;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'text', nullable: true })
  rejectReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
