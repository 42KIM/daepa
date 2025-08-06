import { Controller, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ParentRequestService } from './parent_request.service';
import { UpdateParentRequestDto } from './parent_request.dto';
import { JwtAuthGuard, JwtUser } from '../auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { ApiResponse } from '@nestjs/swagger';
import { CommonResponseDto } from 'src/common/response.dto';

@Controller('v1/parent-requests')
@UseGuards(JwtAuthGuard)
export class ParentRequestController {
  constructor(private readonly parentRequestService: ParentRequestService) {}

  @Put(':id/status')
  @ApiResponse({
    status: 200,
    description: '부모 관계 상태가 성공적으로 업데이트되었습니다.',
    type: CommonResponseDto,
  })
  async updateStatus(
    @Param('id') notificationId: number,
    @Body() updateParentRequestDto: UpdateParentRequestDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.parentRequestService.updateParentRequestByNotificationId(
      token.userId,
      notificationId,
      updateParentRequestDto,
    );

    return {
      success: true,
      message: '부모 관계 상태가 성공적으로 업데이트되었습니다.',
    };
  }
}
