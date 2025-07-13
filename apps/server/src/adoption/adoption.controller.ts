import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdoptionService } from './adoption.service';
import {
  CreateAdoptionDto,
  UpdateAdoptionDto,
  AdoptionDto,
  AdoptionSummaryDto,
} from './adoption.dto';
import { JwtUser } from '../auth/auth.decorator';
import { JwtUserPayload } from '../auth/strategies/jwt.strategy';
import { PageOptionsDto } from 'src/common/page.dto';
import { PageDto } from 'src/common/page.dto';

@ApiTags('분양')
@Controller('/v1/adoption')
export class AdoptionController {
  constructor(private readonly adoptionService: AdoptionService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: '분양 정보 생성 성공',
    type: AdoptionDto,
  })
  async createAdoption(
    @JwtUser() token: JwtUserPayload,
    @Body() createAdoptionDto: CreateAdoptionDto,
  ): Promise<AdoptionDto> {
    return this.adoptionService.createAdoption(token.userId, createAdoptionDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: '분양 전체 리스트 조회 성공',
    type: [AdoptionSummaryDto],
  })
  async getAllAdoptions(
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<AdoptionSummaryDto>> {
    return this.adoptionService.findAll(pageOptionsDto);
  }

  @Get('/:adoptionId')
  @ApiResponse({
    status: 200,
    description: '펫별 분양 정보 조회 성공',
    type: AdoptionDto,
  })
  async getAdoptionByAdoptionId(
    @Param('adoptionId') adoptionId: string,
  ): Promise<AdoptionDto | null> {
    return this.adoptionService.findByAdoptionId(adoptionId);
  }

  @Put('/:adoptionId')
  @ApiResponse({
    status: 200,
    description: '분양 정보 수정 성공',
    type: AdoptionDto,
  })
  async updateAdoption(
    @Param('adoptionId') adoptionId: string,
    @Body() updateAdoptionDto: UpdateAdoptionDto,
  ): Promise<AdoptionDto> {
    return this.adoptionService.updateAdoption(adoptionId, updateAdoptionDto);
  }
}
