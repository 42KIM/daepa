import { Body, Controller, Post } from '@nestjs/common';
import { LayingService } from './laying.service';
import { CommonResponseDto } from 'src/common/response.dto';
import { ApiResponse } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { CreateLayingWithEggDto } from './laying.dto';

@Controller('/v1/laying')
export class LayingController {
  constructor(private readonly layingService: LayingService) {}

  @Post()
  @ApiResponse({
    status: 200,
    description: '산란 정보 등록이 완료되었습니다.',
    type: CommonResponseDto,
  })
  async createLaying(
    @Body() createLayingDto: CreateLayingWithEggDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    await this.layingService.createLayingWithEgg(token.userId, createLayingDto);
    return {
      success: true,
      message: '산란 정보 등록이 완료되었습니다.',
    };
  }
}
