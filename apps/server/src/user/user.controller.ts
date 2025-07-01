import { Body, Controller, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserNameDto } from './user.dto';
import { CommonResponseDto } from 'src/common/response.dto';
import { ApiResponse } from '@nestjs/swagger';

@Controller('/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post(':userId/name')
  @ApiResponse({
    status: 200,
    description: '사용자명 등록 성공',
    type: CommonResponseDto,
  })
  async registerUserName(
    @Param('userId') userId: string,
    @Body() registerUserNameDto: RegisterUserNameDto,
  ) {
    await this.userService.updateUserName(userId, registerUserNameDto.name);
    return {
      success: true,
      message: '사용자명이 성공적으로 등록되었습니다.',
    };
  }
}
