import 'reflect-metadata';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, Module, Injectable } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Entity, PrimaryGeneratedColumn, Column, Repository } from 'typeorm';
import { Resource, Col, Searchable, Rule } from '@faster-crud/core';
import { CrudControllerFactory } from '@faster-crud/nest';
import { TypeOrmResourceService } from '@faster-crud/typeorm';

// ── Simple User entity for testing ──────────────────────────────────────────

@Entity()
@Resource('users', {
  operations: ['create', 'list', 'get', 'update', 'remove'],
})
class User {
  @PrimaryGeneratedColumn()
  @Col({ label: 'ID' })
  id!: number;

  @Column()
  @Col({ label: 'Name', list: { sortable: true, filterable: true } })
  @Rule.required()
  @Searchable()
  name!: string;

  @Column()
  @Col({ label: 'Email' })
  @Rule.required()
  @Rule.email()
  @Searchable()
  email!: string;
}

@Injectable()
class UsersService extends TypeOrmResourceService(User) {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }
}

const UsersController = CrudControllerFactory.create(User, UsersService);

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})
class UsersModule {}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CRUD E2E – /users', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqljs',
          entities: [User],
          synchronize: true,
        }),
        UsersModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── 1. POST /users — create ─────────────────────────────────────────────

  it('POST /users – creates a user and returns 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Alice', email: 'alice@example.com' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      name: 'Alice',
      email: 'alice@example.com',
    });
  });

  // ── 2. GET /users — list with pagination ────────────────────────────────

  it('GET /users – lists users with pagination envelope', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .expect(200);

    expect(res.body).toMatchObject({
      data: expect.any(Array),
      total: expect.any(Number),
      page: 1,
      size: 10,
    });
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // ── 3. GET /users/:id — single + missing ──────────────────────────────

  it('GET /users/:id – returns user by id', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/1')
      .expect(200);

    expect(res.body).toMatchObject({ id: 1, name: 'Alice' });
  });

  it('GET /users/:id – returns empty for non-existent id', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/9999')
      .expect(200);

    // The service returns null for missing records; NestJS serialises as empty body
    expect(res.body === null || Object.keys(res.body).length === 0).toBe(true);
  });

  // ── 4. PATCH /users/:id — update ───────────────────────────────────────

  it('PATCH /users/:id – updates and returns updated entity', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/1')
      .send({ name: 'Alice Updated' })
      .expect(200);

    expect(res.body).toMatchObject({ id: 1, name: 'Alice Updated' });
  });

  // ── 5. DELETE /users/:id — remove ──────────────────────────────────────

  it('DELETE /users/:id – deletes the user', async () => {
    // Create a user to delete
    const created = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'ToDelete', email: 'del@example.com' })
      .expect(201);

    const id = created.body.id;

    await request(app.getHttpServer())
      .delete(`/users/${id}`)
      .expect(200);

    // Verify it's gone
    const after = await request(app.getHttpServer())
      .get(`/users/${id}`)
      .expect(200);

    expect(after.body === null || Object.keys(after.body).length === 0).toBe(true);
  });

  // ── 6. Filter: like operator ───────────────────────────────────────────

  it('GET /users?filters – filters by name with "like" operator', async () => {
    // Seed additional users
    await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'John Doe', email: 'john@example.com' });
    await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Johnny Cash', email: 'johnny@example.com' });
    await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Bob Smith', email: 'bob@example.com' });

    const res = await request(app.getHttpServer())
      .get('/users')
      .query({
        'filters[name][op]': 'like',
        'filters[name][value]': 'John',
      })
      .expect(200);

    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((u: any) => u.name.includes('John'))).toBe(true);
  });

  // ── 7. Pagination ─────────────────────────────────────────────────────

  it('GET /users?page – respects pagination parameters', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .query({
        'page[current]': '1',
        'page[size]': '2',
      })
      .expect(200);

    expect(Number(res.body.page)).toBe(1);
    expect(Number(res.body.size)).toBe(2);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.total).toBeGreaterThan(2); // we have more than 2 users
  });

  it('GET /users?page – page 2 returns different users', async () => {
    const page1 = await request(app.getHttpServer())
      .get('/users')
      .query({ 'page[current]': '1', 'page[size]': '2' })
      .expect(200);

    const page2 = await request(app.getHttpServer())
      .get('/users')
      .query({ 'page[current]': '2', 'page[size]': '2' })
      .expect(200);

    // Pages should have different data
    const ids1 = page1.body.data.map((u: any) => u.id);
    const ids2 = page2.body.data.map((u: any) => u.id);
    expect(ids1.every((id: number) => !ids2.includes(id))).toBe(true);
  });

  // ── 8. Sort ────────────────────────────────────────────────────────────

  it('GET /users?sort – sorts by name ascending', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .query({
        'sort[field]': 'name',
        'sort[order]': 'asc',
      })
      .expect(200);

    const names = res.body.data.map((u: any) => u.name);
    const sorted = [...names].sort((a: string, b: string) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('GET /users?sort – sorts by name descending', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .query({
        'sort[field]': 'name',
        'sort[order]': 'desc',
      })
      .expect(200);

    const names = res.body.data.map((u: any) => u.name);
    const sorted = [...names].sort((a: string, b: string) => b.localeCompare(a));
    expect(names).toEqual(sorted);
  });
});
