import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PARENT_ROLE, PARENT_STATUS } from './parent_request.constants';

export class CreateParentRequestDto {
  @IsNotEmpty()
  @IsString()
  requesterId: string;

  @IsNotEmpty()
  @IsString()
  childPetId: string;

  @IsNotEmpty()
  @IsString()
  parentPetId: string;

  @IsNotEmpty()
  @IsEnum(PARENT_ROLE)
  role: PARENT_ROLE;

  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateParentRequestDto {
  @IsOptional()
  @IsEnum(PARENT_STATUS)
  status?: PARENT_STATUS;

  @IsOptional()
  @IsString()
  rejectReason?: string;
}

export class ParentRequestResponseDto {
  id: number;
  requesterId: string;
  childPetId: string;
  parentPetId: string;
  role: PARENT_ROLE;
  status: PARENT_STATUS;
  message?: string;
  rejectReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateParentDto {
  @IsNotEmpty()
  @IsString()
  parentId: string;

  @IsNotEmpty()
  @IsEnum(PARENT_ROLE)
  role: PARENT_ROLE;

  @IsOptional()
  @IsString()
  message?: string;
}
