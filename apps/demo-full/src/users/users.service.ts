import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmResourceService } from '@faster-crud/typeorm';
import { User } from '../entities/user.entity';

const VALID_ROLES = ['admin', 'user'];

@Injectable()
export class UsersService extends TypeOrmResourceService(User) {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo as any);
  }

  async onBeforeCreate(dto: Partial<User>): Promise<Partial<User>> {
    dto.createdAt = new Date();
    console.log('[hook] onBeforeCreate — stamped createdAt');
    return dto;
  }

  async onAfterCreate(entity: User): Promise<void> {
    console.log(`[hook] onAfterCreate — User created: ${entity.name}`);
  }

  async onBeforeUpdate(_id: number, dto: Partial<User>): Promise<Partial<User>> {
    if (dto.role && !VALID_ROLES.includes(dto.role)) {
      throw new Error(`Invalid role "${dto.role}". Must be one of: ${VALID_ROLES.join(', ')}`);
    }
    return dto;
  }
}
