import 'reflect-metadata';
import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  DynamicModule,
  ExecutionContext,
  Injectable,
  Module,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export const ROLES_KEY = 'faster-crud:roles';
export const AUTH_CRUD_OPTIONS = 'FASTER_CRUD_AUTH_OPTIONS';

export type AuthCrudModuleOptions = {
  secret: string;
  roles?: string[];
};

export type AuthenticatedRequest = {
  headers?: Record<string, string | string[] | undefined>;
  user?: {
    roles?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const roles =
      Reflect.getMetadata(ROLES_KEY, context.getHandler()) ??
      Reflect.getMetadata(ROLES_KEY, context.getClass()) ??
      [];

    if (!Array.isArray(roles) || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRoles = request.user?.roles;

    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      return false;
    }

    return roles.some((role) => userRoles.includes(role));
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers?.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload as AuthenticatedRequest['user'];
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);

@Module({})
export class AuthCrudModule {
  static register(options: AuthCrudModuleOptions): DynamicModule {
    const jwtServiceProvider = {
      provide: JwtService,
      useFactory: () => new JwtService({ secret: options.secret }),
    };

    return {
      module: AuthCrudModule,
      providers: [
        {
          provide: AUTH_CRUD_OPTIONS,
          useValue: options,
        },
        jwtServiceProvider,
        JwtAuthGuard,
        RolesGuard,
      ],
      exports: [AUTH_CRUD_OPTIONS, JwtService, JwtAuthGuard, RolesGuard],
    };
  }
}

export const Protected = () => UseGuards(JwtAuthGuard);

export const AdminOnly = () => applyDecorators(Roles('admin'), UseGuards(JwtAuthGuard, RolesGuard));

function extractBearerToken(authorization?: string | string[]): string | null {
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}
