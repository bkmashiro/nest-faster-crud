import { SetMetadata, UseGuards, applyDecorators } from "@nestjs/common";
import { PermissionGuard } from "../guards/guards.guard";

export const ATTR_KEY = 'attrs'

export function SetAttrs(...attrs: string[]){
  return SetMetadata(ATTR_KEY, attrs);
}

export function Permission(...attrs: string[]){
  return applyDecorators(
    PermissionGuard(),
    SetAttrs(...attrs),
  );
}
