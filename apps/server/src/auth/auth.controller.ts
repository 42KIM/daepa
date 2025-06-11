import {
  Controller,
  Get,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { ApiResponse } from '@nestjs/swagger';
import { UserDto } from 'src/user/user.dto';
import { OAuthAuthenticatedUser } from './auth.decorator';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('sign-in/kakao')
  @ApiResponse({
    status: 302,
    description: '카카오 로그인 성공',
    type: UserDto,
  })
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin(
    @OAuthAuthenticatedUser() user: UserDto,
    @Res() res: Response,
  ) {
    if (!user) {
      throw new UnauthorizedException('로그인 실패');
    }
    console.log('user found: ', user);
    // user 정보를 사용하여 JWT 토큰 생성

    await Promise.resolve();
    // JWT 응답
    return res.redirect(
      `http://localhost:3000/sign-in/kakao?accessToken="accessToken"&refreshToken="refreshToken"`,
    );
  }
}
