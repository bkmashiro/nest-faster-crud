import 'reflect-metadata';
import { Resource, Col, Rule, Searchable } from '@faster-crud/core';

// Mock @nestjs/common before importing controller.factory
jest.mock('@nestjs/common', () => {
  function noopDecorator(..._args: any[]) {
    return (..._targets: any[]) => {};
  }
  return {
    Controller: () => (target: any) => target,
    Get: () => noopDecorator,
    Post: () => noopDecorator,
    Patch: () => noopDecorator,
    Delete: () => noopDecorator,
    Body: () => noopDecorator,
    Param: () => noopDecorator,
    Query: () => noopDecorator,
    Injectable: () => (target: any) => target,
    Inject: () => noopDecorator,
    Type: class {},
  };
});

import { CrudControllerFactory } from '../controller.factory';

// --- Test entity ---
@Resource('products', { operations: ['create', 'list', 'get', 'update', 'remove'] })
class Product {
  @Col() id!: number;
  @Searchable() @Col() name!: string;
  @Rule.required() @Col() price!: number;
}

@Resource('readonly-items', { operations: ['list', 'get'] })
class ReadonlyItem {
  @Col() id!: number;
  @Col() title!: string;
}

@Resource('archived-products', {
  operations: ['list', 'get', 'remove'],
  softDelete: true,
})
class ArchivedProduct {
  @Col() id!: number;
  @Col() title!: string;
}

// --- Mock service factory ---
function createMockService() {
  return {
    create: jest.fn(async (dto: any) => ({ id: 1, ...dto })),
    list: jest.fn(async (query: any) => ({ data: [], total: 0, page: 1, size: 10 })),
    get: jest.fn(async (id: number) => ({ id, name: 'Test', price: 9.99 })),
    update: jest.fn(async (id: number, dto: any) => ({ id, ...dto })),
    remove: jest.fn(async (id: number) => undefined),
    restore: jest.fn(async (id: number) => ({ id })),
  };
}

describe('CrudControllerFactory', () => {
  describe('create()', () => {
    it('returns a controller class', () => {
      const ServiceClass = class {};
      const Controller = CrudControllerFactory.create(Product, ServiceClass as any);
      expect(Controller).toBeDefined();
      expect(typeof Controller).toBe('function');
    });

    it('throws when entity has no @Resource decorator', () => {
      class Bare {}
      class SomeService {}
      expect(() => CrudControllerFactory.create(Bare, SomeService as any))
        .toThrow('@Resource decorator not found on Bare');
    });

    it('creates a controller instance with the injected service', () => {
      const mockService = createMockService();
      const ServiceClass = class {};
      const Controller = CrudControllerFactory.create(Product, ServiceClass as any);

      // Instantiate with mock service (simulating DI injection)
      const controller = new (Controller as any)(mockService);
      expect(controller.service).toBe(mockService);
    });
  });

  describe('generated controller methods', () => {
    let controller: any;
    let mockService: ReturnType<typeof createMockService>;

    beforeEach(() => {
      mockService = createMockService();
      const ServiceClass = class {};
      const Controller = CrudControllerFactory.create(Product, ServiceClass as any);
      controller = new (Controller as any)(mockService);
    });

    it('has create method that delegates to service.create', async () => {
      expect(controller.create).toBeDefined();
      const dto = { name: 'Widget', price: 9.99 };
      await controller.create(dto);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('has list method that delegates to service.list', async () => {
      expect(controller.list).toBeDefined();
      const query = { page: { current: 1, size: 10 } };
      await controller.list(query);
      expect(mockService.list).toHaveBeenCalledWith(query);
    });

    it('list passes empty object when query is undefined', async () => {
      await controller.list(undefined);
      expect(mockService.list).toHaveBeenCalledWith({});
    });

    it('has get method that delegates to service.get with parsed id', async () => {
      expect(controller.get).toBeDefined();
      await controller.get('42');
      expect(mockService.get).toHaveBeenCalledWith(42);
    });

    it('has update method that delegates to service.update with parsed id', async () => {
      expect(controller.update).toBeDefined();
      const dto = { name: 'Updated' };
      await controller.update('7', dto);
      expect(mockService.update).toHaveBeenCalledWith(7, dto);
    });

    it('has remove method that delegates to service.remove with parsed id', async () => {
      expect(controller.remove).toBeDefined();
      await controller.remove('3');
      expect(mockService.remove).toHaveBeenCalledWith(3);
    });

    it('create returns service result', async () => {
      mockService.create.mockResolvedValue({ id: 1, name: 'Widget', price: 9.99 });
      const result = await controller.create({ name: 'Widget', price: 9.99 });
      expect(result).toEqual({ id: 1, name: 'Widget', price: 9.99 });
    });

    it('get returns service result', async () => {
      mockService.get.mockResolvedValue({ id: 5, name: 'Item', price: 3.5 });
      const result = await controller.get('5');
      expect(result).toEqual({ id: 5, name: 'Item', price: 3.5 });
    });
  });

  describe('operations filtering', () => {
    it('readonly controller only has list and get methods', () => {
      const ServiceClass = class {};
      const Controller = CrudControllerFactory.create(ReadonlyItem, ServiceClass as any);
      const mockService = createMockService();
      const controller = new (Controller as any)(mockService);

      expect(controller.list).toBeDefined();
      expect(controller.get).toBeDefined();
      expect(controller.create).toBeUndefined();
      expect(controller.update).toBeUndefined();
      expect(controller.remove).toBeUndefined();
    });

    it('creates distinct controller classes for different entities', () => {
      const ServiceClassA = class {};
      const ServiceClassB = class {};
      const ControllerA = CrudControllerFactory.create(Product, ServiceClassA as any);
      const ControllerB = CrudControllerFactory.create(ReadonlyItem, ServiceClassB as any);

      expect(ControllerA).not.toBe(ControllerB);
    });

    it('each call creates a new controller class', () => {
      const ServiceClass = class {};
      const ControllerA = CrudControllerFactory.create(Product, ServiceClass as any);
      const ControllerB = CrudControllerFactory.create(Product, ServiceClass as any);
      expect(ControllerA).not.toBe(ControllerB);
    });

    it('adds restore only for soft delete resources', async () => {
      const ServiceClass = class {};
      const Controller = CrudControllerFactory.create(ArchivedProduct, ServiceClass as any);
      const mockService = createMockService();
      const controller = new (Controller as any)(mockService);

      expect(controller.restore).toBeDefined();
      await controller.restore('9');
      expect(mockService.restore).toHaveBeenCalledWith(9);
    });
  });
});
