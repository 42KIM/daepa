import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { USER_ROLE, USER_STATUS } from './user.constant';
import { AdoptionEntity } from 'src/adoption/adoption.entity';

@Entity({ name: 'users' })
@Index('UNIQUE_USER_ID', ['userId'], { unique: true })
@Index('UNIQUE_EMAIL', ['email'], { unique: true })
@Index('UNIQUE_USER_NAME', ['name'], { unique: true })
export class UserEntity {
  @Exclude()
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: USER_ROLE,
  })
  role: USER_ROLE;

  @Column({ default: false })
  isBiz: boolean; // is_biz로 자동 변환됨

  @Column({ type: 'varchar', nullable: true })
  refreshToken?: string | null; // refresh_token으로 자동 변환됨

  @Column({ type: 'datetime', nullable: true })
  refreshTokenExpiresAt?: Date | null; // refresh_token_expires_at으로 자동 변환됨

  @Column({
    type: 'enum',
    enum: USER_STATUS,
  })
  status: USER_STATUS;

  @CreateDateColumn()
  createdAt: Date; // created_at으로 자동 변환됨

  @UpdateDateColumn()
  updatedAt: Date; // updated_at으로 자동 변환됨

  @OneToOne(() => AdoptionEntity, (adoption) => adoption)
  adoption: AdoptionEntity;
}
