import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudControllerFactory } from '@faster-crud/nest';
import { Post } from '../entities/post.entity';
import { PostsService } from './posts.service';

const PostsController = CrudControllerFactory.create(Post, PostsService);

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
