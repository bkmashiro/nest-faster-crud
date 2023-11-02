import { SetMetadata, applyDecorators } from '@nestjs/common';
import { authedGuard } from '../guards/guards.guard';
import { ROLES } from './roles.constants';

// export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

export const ROLES_KEY = 'roles'

export function SetAttrs(...attrs: string[]){
  return SetMetadata(ROLES_KEY, attrs);
}

export function Roles(...attrs: string[]){
  return applyDecorators(
    authedGuard(),
    SetAttrs(...attrs),
  );
}

/**
 * Equivalent to \@Roles(ROLES.ADMIN)
 */

export function AdminRole() {
  return Roles(ROLES.ADMIN);
}
/**
 * Equivalent to \@Roles(ROLES.USER)
 */
export function UserRole() {
  return Roles(ROLES.USER);
}