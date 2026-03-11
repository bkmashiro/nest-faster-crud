import 'reflect-metadata';
import { ROLES_KEY, Roles, RolesGuard, JwtAuthGuard, CurrentUser } from '../index';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

function mockExecutionContext(overrides: {
  handler?: Record<string, any>;
  cls?: Record<string, any>;
  request?: Record<string, any>;
} = {}): ExecutionContext {
  const handler = Object.assign(() => {}, overrides.handler ?? {});
  const cls = Object.assign(class {}, overrides.cls ?? {});
  const request = overrides.request ?? {};

  return {
    getHandler: () => handler,
    getClass: () => cls as any,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => (() => {}),
    }),
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({} as any),
    switchToWs: () => ({} as any),
    getType: () => 'http' as any,
  } as ExecutionContext;
}

describe('Roles decorator', () => {
  it('should set metadata with ROLES_KEY', () => {
    @Roles('admin', 'editor')
    class TestHandler {}

    const roles = Reflect.getMetadata(ROLES_KEY, TestHandler);
    expect(roles).toEqual(['admin', 'editor']);
  });

  it('should set empty roles array', () => {
    @Roles()
    class TestHandler {}

    const roles = Reflect.getMetadata(ROLES_KEY, TestHandler);
    expect(roles).toEqual([]);
  });
});

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard();
  });

  it('should allow access when no roles are required', () => {
    const ctx = mockExecutionContext();
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access when roles required but user has none', () => {
    const handler = () => {};
    Reflect.defineMetadata(ROLES_KEY, ['admin'], handler);
    const ctx = mockExecutionContext({
      handler: {},
      request: { user: {} },
    });
    // Override getHandler to return our decorated handler
    (ctx as any).getHandler = () => handler;

    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should allow access when user has matching role', () => {
    const handler = () => {};
    Reflect.defineMetadata(ROLES_KEY, ['admin'], handler);
    const ctx = mockExecutionContext({
      request: { user: { roles: ['admin', 'user'] } },
    });
    (ctx as any).getHandler = () => handler;

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access when user roles do not match', () => {
    const handler = () => {};
    Reflect.defineMetadata(ROLES_KEY, ['admin'], handler);
    const ctx = mockExecutionContext({
      request: { user: { roles: ['user'] } },
    });
    (ctx as any).getHandler = () => handler;

    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should check class-level metadata if handler has none', () => {
    const cls = class {};
    Reflect.defineMetadata(ROLES_KEY, ['editor'], cls);
    const ctx = mockExecutionContext({
      request: { user: { roles: ['editor'] } },
    });
    (ctx as any).getClass = () => cls;

    expect(guard.canActivate(ctx)).toBe(true);
  });
});

describe('JwtAuthGuard', () => {
  const secret = 'test-secret';
  let jwtService: JwtService;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jwtService = new JwtService({ secret });
    guard = new JwtAuthGuard(jwtService);
  });

  it('should throw UnauthorizedException when no token present', async () => {
    const ctx = mockExecutionContext({ request: { headers: {} } });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Missing bearer token');
  });

  it('should throw UnauthorizedException for invalid token', async () => {
    const ctx = mockExecutionContext({
      request: { headers: { authorization: 'Bearer invalid-token' } },
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Invalid or expired token');
  });

  it('should return true and set user for valid token', async () => {
    const payload = { sub: 1, roles: ['admin'] };
    const token = await jwtService.signAsync(payload);
    const request: Record<string, any> = {
      headers: { authorization: `Bearer ${token}` },
    };
    const ctx = mockExecutionContext({ request });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(request.user).toBeDefined();
    expect(request.user.sub).toBe(1);
    expect(request.user.roles).toEqual(['admin']);
  });

  it('should handle authorization as array', async () => {
    const ctx = mockExecutionContext({
      request: { headers: { authorization: ['not-bearer'] } },
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Missing bearer token');
  });
});

describe('CurrentUser decorator', () => {
  it('should be defined as a function', () => {
    expect(CurrentUser).toBeDefined();
  });
});
