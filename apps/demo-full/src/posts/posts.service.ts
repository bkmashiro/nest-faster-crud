import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmResourceService } from '@faster-crud/typeorm';
import { Post } from '../entities/post.entity';

@Injectable()
export class PostsService extends TypeOrmResourceService(Post) {
  constructor(@InjectRepository(Post) repo: Repository<Post>) {
    super(repo);
  }
}
