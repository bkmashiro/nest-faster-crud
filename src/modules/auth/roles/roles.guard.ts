import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesEnum } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return matchRoles(roles, user.role);
  }
}

function matchRoles(roles: string[], role: any): boolean {
  const roleValue = RolesEnum[role];
  if (roleValue === undefined) {
    return false;
  }
  const lowestRole = roles.reduce((acc, r) => {
    const roleValue = RolesEnum[r];
    if (roleValue === undefined) {
      return acc;
    }
    return roleValue < acc ? roleValue : acc;
  }, RolesEnum.sa);
  return roleValue >= lowestRole;
}
