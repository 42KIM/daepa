import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ValidatedUser } from './auth.service';
import { JwtUserPayload } from './strategies/jwt.strategy';

export const PassportValidatedUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: ValidatedUser }>();
    return request.user;
  },
);

export const JwtUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtUserPayload }>();
    return request.user;
  },
);

export const OptionalJwtUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUserPayload }>();
    return request.user ?? null;
  },
);

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Public 데코레이터가 있는 경우 가드를 건너뜀
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = JwtUserPayload>(
    err: any,
    user: TUser,
    info: { message?: string },
    // context: ExecutionContext,
  ) {
    if (['No auth token', 'jwt expired'].includes(info?.message ?? '')) {
      throw new UnauthorizedException('ACCESS_TOKEN_INVALID');
    }

    if (err || !user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = JwtUserPayload>(err: any, user: TUser) {
    // 인증 실패해도 에러를 던지지 않고 null 반환
    // 이를 통해 공개 펫은 누구나 볼 수 있고, 비공개 펫은 소유자만 볼 수 있게 함
    return user || null;
  }
}
