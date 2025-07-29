import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
} from '@nestjs/common';
import { LayingService } from './laying.service';
import { CreateLayingDto, UpdateLayingDto } from './laying.dto';
import { LayingEntity } from './laying.entity';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';

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
  async create(
    @Body() createLayingDto: CreateLayingDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    return this.layingService.createLaying(createLayingDto, token.userId);
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: '산란 정보가 성공적으로 수정되었습니다.',
    type: LayingEntity,
  })
  async update(
    @Param('id') id: number,
    @Body() updateLayingDto: UpdateLayingDto,
  ) {
    return this.layingService.updateLaying(id, updateLayingDto);
  }
}
