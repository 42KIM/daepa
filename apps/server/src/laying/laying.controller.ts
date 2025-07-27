import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { LayingService } from './laying.service';
import { CreateLayingDto } from './laying.dto';
import { LayingEntity } from './laying.entity';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth.decorator';

@ApiTags('산란')
@Controller('v1/layings')
@UseGuards(JwtAuthGuard)
export class LayingController {
  constructor(private readonly layingService: LayingService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: '산란 정보가 성공적으로 추가되었습니다.',
    type: LayingEntity,
  })
  async create(@Body() createLayingDto: CreateLayingDto) {
    return this.layingService.createLaying(createLayingDto);
  }
}
