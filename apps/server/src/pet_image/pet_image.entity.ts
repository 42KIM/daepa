import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'pet_images' })
@Index('UNIQUE_PET_ID_FILE_NAME', ['petId', 'fileName'], { unique: true })
export class PetImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  petId: string;

  @Column()
  fileName: string;

  @Column()
  url: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
