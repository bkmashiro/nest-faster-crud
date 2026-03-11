import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudControllerFactory } from '@faster-crud/nest';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';

const UsersController = CrudControllerFactory.create(User, UsersService);

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
