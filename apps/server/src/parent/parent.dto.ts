import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PARENT_ROLE, PARENT_STATUS } from './parent.constant';

export class CreateParentDto {
  @ApiProperty({ description: '부모 ID' })
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({ description: '부모 구분' })
  @IsNotEmpty()
  role: PARENT_ROLE;
}

export class UpdateParentDto {
  @ApiProperty({ description: '부모 ID' })
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @ApiProperty({
    description: '변경할 상태',
    example: 'pending',
  })
  @IsString()
  @IsNotEmpty()
  updateStatus: PARENT_STATUS;
}

export class DeleteParentDto {
  @ApiProperty({
    description: '부모 ID',
  })
  @IsString()
  @IsNotEmpty()
  parentId: string;
}
