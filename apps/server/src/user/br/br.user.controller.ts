import { Controller, Get, Query } from '@nestjs/common';
import { UserService } from '../user.service';
import { BrAccessOnly } from 'src/common/decorators/roles.decorator';
import { PageDto, PageMetaDto } from 'src/common/page.dto';
import { UserDto, UserFilterDto } from '../user.dto';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { JwtUser } from 'src/auth/auth.decorator';

@Controller('/v1/br/user')
@BrAccessOnly()
export class BrUserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  @ApiExtraModels(UserDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: 'BR룸 사용자 목록 조회 성공',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(UserDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
  })
  async getUsers(
    @Query() query: UserFilterDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<PageDto<UserDto>> {
    return this.userService.getUsers(query, token.userId);
  }
}
