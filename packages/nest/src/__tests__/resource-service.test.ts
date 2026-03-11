import 'reflect-metadata';
import { Resource, Col, Deny, Hidden, Ignore, Rule, PageQuery, PageResult } from '@faster-crud/core';
import { ResourceService } from '../resource.service';

// ── Test entity ──
@Resource('user')
class User {
  @Col({ label: 'ID' })
  @Deny('create', 'update')
  id!: number;

  @Col({ label: 'Name' })
  @Rule.required()
  @Rule.length(2, 50)
  name!: string;

  @Col({ label: 'Email' })
  @Rule.required()
  @Rule.email()
  email!: string;

  @Col({ label: 'Age' })
  @Rule.range(0, 150)
  age!: number;

  @Hidden('list')
  @Col({ label: 'Password' })
  password!: string;

  @Ignore()
  temp!: string;
}

// ── Concrete service subclass for testing ──
class UserService extends ResourceService<User>(User) {
  private store: Map<number, User> = new Map();
  private nextId = 1;

  async create(dto: Partial<User>): Promise<User> {
    const processed = await this.onBeforeCreate(dto);
    this.validateCreate(processed);
    const user = { ...processed, id: this.nextId++ } as User;
    this.store.set(user.id, user);
    await this.onAfterCreate(user);
    return user;
  }

  async list(_query: PageQuery<User>): Promise<PageResult<User>> {
    const data = Array.from(this.store.values());
    return { data, total: data.length, page: 1, size: data.length };
  }

  async get(id: number): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async update(id: number, dto: Partial<User>): Promise<User> {
    const processed = await this.onBeforeUpdate(id, dto);
    const existing = this.store.get(id);
    if (!existing) throw new Error('Not found');
    const updated = { ...existing, ...processed };
    this.store.set(id, updated);
    await this.onAfterUpdate(updated);
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.onBeforeRemove(id);
    this.store.delete(id);
    await this.onAfterRemove(id);
  }

  // Expose protected methods for testing
  public testValidateCreate(dto: any) {
    return this.validateCreate(dto);
  }

  public testFilterForView(record: any, view: 'list' | 'get') {
    return this.filterForView(record, view);
  }
}

describe('ResourceService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  describe('CRUD operations', () => {
    it('create stores and returns entity with id', async () => {
      const user = await service.create({ name: 'Alice', email: 'alice@test.com', age: 30 });
      expect(user.id).toBe(1);
      expect(user.name).toBe('Alice');
    });

    it('get returns created entity', async () => {
      await service.create({ name: 'Bob', email: 'bob@test.com', age: 25 });
      const found = await service.get(1);
      expect(found).not.toBeNull();
      expect(found!.name).toBe('Bob');
    });

    it('get returns null for missing id', async () => {
      expect(await service.get(999)).toBeNull();
    });

    it('list returns all entities', async () => {
      await service.create({ name: 'Alice', email: 'a@test.com', age: 1 });
      await service.create({ name: 'Bobby', email: 'b@test.com', age: 2 });
      const result = await service.list({});
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it('update modifies entity', async () => {
      await service.create({ name: 'Old', email: 'old@test.com', age: 20 });
      const updated = await service.update(1, { name: 'New' });
      expect(updated.name).toBe('New');
      expect(updated.email).toBe('old@test.com');
    });

    it('update throws for missing entity', async () => {
      await expect(service.update(999, { name: 'X' })).rejects.toThrow('Not found');
    });

    it('remove deletes entity', async () => {
      await service.create({ name: 'Del', email: 'del@test.com', age: 10 });
      await service.remove(1);
      expect(await service.get(1)).toBeNull();
    });
  });

  describe('validateCreate', () => {
    it('throws when denied field is present in dto', () => {
      expect(() => service.testValidateCreate({ id: 1, name: 'X', email: 'x@t.com' }))
        .toThrow("Field 'id' is not allowed on create");
    });

    it('throws when required field is missing', () => {
      expect(() => service.testValidateCreate({ age: 10 }))
        .toThrow('name is required');
    });

    it('throws when required field is empty string', () => {
      // length rule fires before required (decorators execute bottom-up)
      expect(() => service.testValidateCreate({ name: '', email: 'a@b.c' }))
        .toThrow('name must be between 2 and 50 characters');
    });

    it('throws on length violation', () => {
      expect(() => service.testValidateCreate({ name: 'X', email: 'a@b.com' }))
        .toThrow('name must be between 2 and 50 characters');
    });

    it('throws on invalid email', () => {
      expect(() => service.testValidateCreate({ name: 'Alice', email: 'not-an-email' }))
        .toThrow('email must be a valid email');
    });

    it('throws on range violation', () => {
      expect(() => service.testValidateCreate({ name: 'Alice', email: 'a@b.com', age: 200 }))
        .toThrow('age must be between 0 and 150');
    });

    it('passes with valid data', () => {
      expect(() => service.testValidateCreate({ name: 'Alice', email: 'alice@test.com', age: 25 }))
        .not.toThrow();
    });
  });

  describe('filterForView', () => {
    const record = { id: 1, name: 'Alice', email: 'alice@t.com', age: 25, password: 'secret', temp: 'x' };

    it('filters hidden fields from list view', () => {
      const result = service.testFilterForView(record, 'list');
      expect(result.password).toBeUndefined();
      expect(result.name).toBe('Alice');
    });

    it('includes hidden-from-list fields in get view', () => {
      const result = service.testFilterForView(record, 'get');
      expect(result.password).toBe('secret');
    });

    it('always excludes ignored fields', () => {
      const listResult = service.testFilterForView(record, 'list');
      const getResult = service.testFilterForView(record, 'get');
      expect(listResult.temp).toBeUndefined();
      expect(getResult.temp).toBeUndefined();
    });
  });

  describe('lifecycle hooks', () => {
    it('onBeforeCreate is called and can transform dto', async () => {
      const spy = jest.spyOn(service, 'onBeforeCreate').mockResolvedValue({
        name: 'Transformed',
        email: 'transformed@test.com',
        age: 99,
      });

      const user = await service.create({ name: 'Original', email: 'orig@test.com', age: 1 });
      expect(spy).toHaveBeenCalledWith({ name: 'Original', email: 'orig@test.com', age: 1 });
      expect(user.name).toBe('Transformed');
    });

    it('onAfterCreate is called with created entity', async () => {
      const spy = jest.spyOn(service, 'onAfterCreate');
      await service.create({ name: 'Test', email: 'test@test.com', age: 20 });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toHaveProperty('id');
    });

    it('onBeforeUpdate is called', async () => {
      await service.create({ name: 'Alice', email: 'alice@t.com', age: 1 });
      const spy = jest.spyOn(service, 'onBeforeUpdate');
      await service.update(1, { name: 'Bobby' });
      expect(spy).toHaveBeenCalledWith(1, { name: 'Bobby' });
    });

    it('onAfterUpdate is called', async () => {
      await service.create({ name: 'Alice', email: 'alice@t.com', age: 1 });
      const spy = jest.spyOn(service, 'onAfterUpdate');
      await service.update(1, { name: 'Bobby' });
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('onBeforeRemove and onAfterRemove are called', async () => {
      await service.create({ name: 'Alice', email: 'alice@t.com', age: 1 });
      const beforeSpy = jest.spyOn(service, 'onBeforeRemove');
      const afterSpy = jest.spyOn(service, 'onAfterRemove');
      await service.remove(1);
      expect(beforeSpy).toHaveBeenCalledWith(1);
      expect(afterSpy).toHaveBeenCalledWith(1);
    });
  });
});
