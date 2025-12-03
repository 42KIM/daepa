import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PET_SPECIES } from 'src/pet/pet.constants';

@Entity({ name: 'pairs' })
@Index('UNIQUE_PAIR', ['ownerId', 'fatherId', 'motherId'], {
  unique: true,
})
export class PairEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ownerId: string;

  @Column({ type: 'enum', enum: PET_SPECIES, nullable: false })
  species: PET_SPECIES; // 종

  @Column()
  fatherId: string;

  @Column()
  motherId: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
