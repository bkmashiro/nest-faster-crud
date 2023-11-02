import { UseGuards, applyDecorators } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RolesGuard } from "../roles/roles.guard";
import { AttributeGuard } from "../attrs/attr.guards";
import { NoRestrictGuard } from "./no-restrict.guard";

//@authedGuards decorator, contains jwt and roles guard
export function authedGuard(...guards: any[]) {
    return applyDecorators(
        UseGuards(AuthGuard('jwt'), RolesGuard, ...guards),
        ApiBearerAuth(),
    );
}

//@jwtGuards decorator, contains jwt guard
export function JWTGuard(...guards: any[]) {
    return applyDecorators(
        UseGuards(AuthGuard('jwt'), ...guards),
        ApiBearerAuth(),
    );
}

//@noGuards decorator, contains no guards
export function noGuard() {
    return applyDecorators(

    );
}
/**
 * @ExtractJwt 
 * 
 * 如果有token则解析为user
 * 
 * 如果没有就设置user为undefined
 * 
 * **注意**：__这不会拦截任何请求__
 */
export function ExtractJwt() {
    return applyDecorators(
        UseGuards(NoRestrictGuard),
    );
}

export function PermissionGuard(...guards: any[]) {
    return applyDecorators(
        UseGuards(AuthGuard('jwt'), AttributeGuard, ...guards),
        ApiBearerAuth(),
    );
}

export default { authedGuard, jwtGuard: JWTGuard, noGuard, PermissionGuard };