import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { BrAccessOnly } from 'src/common/decorators/roles.decorator';
import {
  PairDetailDto,
  PairDto,
  PairFilterDto,
  UpdatePairDto,
} from './pair.dto';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { PairService } from './pair.service';
import { CommonResponseDto } from 'src/common/response.dto';

@Controller('v1/pairs')
@BrAccessOnly()
export class PairController {
  constructor(private readonly pairService: PairService) {}

  @Get()
  @ApiExtraModels(PairDto)
  @ApiResponse({
    status: 200,
    description: '페어 목록 조회 성공',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(PairDto) },
    },
  })
  async getPairList(
    @Query() query: PairFilterDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    return this.pairService.getPairList(token.userId, query.species);
  }

  @Get(':pairId')
  @ApiResponse({
    status: 200,
    description: '페어 상세 정보 조회 성공',
    type: PairDetailDto,
  })
  async getPairDetail(
    @Param('pairId') pairId: string,
    @JwtUser() token: JwtUserPayload,
  ) {
    return this.pairService.getPairDetailById(Number(pairId), token.userId);
  }

  @Patch(':pairId')
  @ApiResponse({
    status: 200,
    description: '메이팅 정보 수정이 완료되었습니다.',
    type: CommonResponseDto,
  })
  async updatePair(
    @Param('pairId') pairId: number,
    @Body() updatePairDto: UpdatePairDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.pairService.updatePair(token.userId, pairId, updatePairDto);
    return {
      success: true,
      message: '메이팅 정보 수정이 완료되었습니다.',
    };
  }
}
