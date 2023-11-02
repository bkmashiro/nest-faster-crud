import { Module } from '@nestjs/common';
import { AttrsController } from './attrs.controller';
import { AttrsService } from './attrs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../user/entities/user.entity';
import { UserModule } from '../../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserModule],
  controllers: [AttrsController],
  providers: [AttrsService]
})
export class AttrsModule {}
