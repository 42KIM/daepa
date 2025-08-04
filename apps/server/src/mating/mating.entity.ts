import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PairEntity } from '../pair/pair.entity';

@Entity({ name: 'matings' })
@Index('UNIQUE_MATING', ['pairId', 'matingDate'], {
  unique: true,
})
export class MatingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pairId: string;

  @ManyToOne(() => PairEntity)
  @JoinColumn({ name: 'pairId', referencedColumnName: 'id' })
  pair: PairEntity;

  @Column({ type: 'date', nullable: true })
  matingDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
