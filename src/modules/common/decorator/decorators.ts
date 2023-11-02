import { SetMetadata, createParamDecorator, ExecutionContext, UseInterceptors, applyDecorators, Param, ParseIntPipe, Logger } from '@nestjs/common';
import { TIMEOUT_KEY } from '../interceptors/interceptors.constants';
import { TimeoutInterceptor } from '../interceptors/interceptors';
import { User as UserType } from '../../user/entities/user.entity';
import { NoRestrictKey } from './decorators.contants';
import { ADMINS, USERS } from 'src/modules/auth/roles/roles.constants';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user) {
      return null;
    }
    if (!data) {
      return request.user as UserType;
    } else {
      return request.user[data as keyof UserType];
    }
  },
);

export function Timeouts(timeout_ms: number) {
  return applyDecorators(
    SetMetadata(TIMEOUT_KEY, timeout_ms),
    UseInterceptors(TimeoutInterceptor),
  )
};

export function NoRestrict() {
  return applyDecorators(
    SetMetadata(NoRestrictKey, true)
  )
}

export function IntParam(param: string) {
  return Param(param, ParseIntPipe)
}

export const IsAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return ADMINS.indexOf(request.user.username) !== -1;
  },
);

export const IsUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return USERS.indexOf(request.user.username) !== -1;
  },
);

