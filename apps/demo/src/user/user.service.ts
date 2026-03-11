import { Injectable } from '@nestjs/common';
import { ResourceService } from '@faster-crud/nest';
import { PageQuery, PageResult } from '@faster-crud/core';
import { User } from './user.entity';

@Injectable()
export class UserService extends ResourceService(User) {
  private store: (User & { id: number })[] = [];
  private seq = 1;

  // ── Lifecycle Hooks ──────────────────────────────────
  async onBeforeCreate(dto: Partial<User>): Promise<Partial<User>> {
    dto.createdAt = new Date();
    console.log('[hook] onBeforeCreate — stamped createdAt');
    return dto;
  }

  async onAfterCreate(entity: User): Promise<void> {
    console.log(`[hook] onAfterCreate — user #${entity.id} created`);
  }

  async onBeforeRemove(id: number): Promise<void> {
    console.log(`[hook] onBeforeRemove — about to delete user #${id}`);
  }

  // ── CRUD Implementation ──────────────────────────────
  async create(dto: Partial<User>): Promise<User> {
    const nextDto = await this.onBeforeCreate(dto);
    this.validateCreate(nextDto);
    const u = { ...nextDto, id: this.seq++, role: 'user' } as User & { id: number };
    this.store.push(u);
    await this.onAfterCreate(u);
    return u;
  }

  async list(query: PageQuery<User>): Promise<PageResult<User>> {
    const { page } = query;
    const filtered = this.store.map(u => this.filterForView(u, 'list'));
    return {
      data:  filtered.slice(((page?.current ?? 1) - 1) * (page?.size ?? 10), (page?.current ?? 1) * (page?.size ?? 10)),
      total: filtered.length,
      page:  page?.current ?? 1,
      size:  page?.size ?? 10,
    };
  }

  async get(id: number): Promise<User | null> {
    const u = this.store.find(x => x.id === id);
    return u ? this.filterForView(u, 'get') : null;
  }

  async update(id: number, dto: Partial<User>): Promise<User> {
    const idx = this.store.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('Not found');
    this.store[idx] = { ...this.store[idx], ...dto };
    return this.store[idx];
  }

  async remove(id: number): Promise<void> {
    await this.onBeforeRemove(id);
    this.store = this.store.filter(x => x.id !== id);
  }
}
