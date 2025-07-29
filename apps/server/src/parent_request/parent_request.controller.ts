import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ParentRequestService } from './parent_request.service';
import {
  CreateParentRequestDto,
  UpdateParentRequestDto,
} from './parent_request.dto';
import { JwtAuthGuard, JwtUser } from '../auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { ApiResponse } from '@nestjs/swagger';
import { CommonResponseDto } from 'src/common/response.dto';

@Controller('parent-requests')
@UseGuards(JwtAuthGuard)
export class ParentRequestController {
  constructor(private readonly parentRequestService: ParentRequestService) {}

  @Post()
  async createParentRequest(
    @Body() createParentRequestDto: CreateParentRequestDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    // 요청자 ID를 현재 로그인한 사용자로 설정
    createParentRequestDto.requesterId = token.userId;
    return await this.parentRequestService.createParentRequest(
      createParentRequestDto,
    );
  }

  @Get('pending/:userId')
  async getPendingRequests(@Param('userId') userId: string) {
    return await this.parentRequestService.findPendingRequestsByReceiverId(
      userId,
    );
  }

  @Get('sent/:userId')
  async getSentRequests(@Param('userId') userId: string) {
    return await this.parentRequestService.findRequestsByRequesterId(userId);
  }

  @Put(':notificationId/status')
  @ApiResponse({
    status: 200,
    description: '부모 관계 상태 업데이트 성공',
    type: CommonResponseDto,
  })
  async updateStatus(
    @Param('notificationId') notificationId: number,
    @Body() updateParentRequestDto: UpdateParentRequestDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    await this.parentRequestService.updateParentRequestByNotificationId(
      token.userId,
      notificationId,
      updateParentRequestDto,
    );

    return {
      success: true,
      message: '부모 연동 상태가 성공적으로 업데이트되었습니다.',
    };
  }

  @Put(':id/approve')
  async approveRequest(
    @Param('id') id: number,
    @JwtUser() token: JwtUserPayload,
  ) {
    return await this.parentRequestService.approveParentRequest(
      id,
      token.userId,
    );
  }

  @Put(':id/reject')
  async rejectRequest(
    @Param('id') id: number,
    @Body() body: { reason?: string },
    @JwtUser() token: JwtUserPayload,
  ) {
    return await this.parentRequestService.rejectParentRequest(
      id,
      token.userId,
      body.reason,
    );
  }

  @Delete(':id/cancel')
  async cancelRequest(
    @Param('id') id: number,
    @JwtUser() token: JwtUserPayload,
  ) {
    return await this.parentRequestService.cancelParentRequest(
      id,
      token.userId,
    );
  }

  @Get(':id')
  async getRequestById(@Param('id') id: number) {
    return await this.parentRequestService.findById(id);
  }
}
