import { Module } from '@nestjs/common';
import { NestCrudModule } from '@faster-crud/nest';
import { User } from './user/user.entity';
import { UserService } from './user/user.service';

@Module({
  imports: [
    NestCrudModule.forFeature([
      { resource: User, service: UserService },
    ]),
  ],
})
export class AppModule {}
