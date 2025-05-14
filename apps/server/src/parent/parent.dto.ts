import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateParentDto {
  @IsString()
  @IsNotEmpty()
  parentId: string;

  @IsString()
  @IsNotEmpty()
  target: 'father' | 'mother';
}

export class DeleteParentDto {
  @IsString()
  @IsNotEmpty()
  target: 'father' | 'mother';
}
