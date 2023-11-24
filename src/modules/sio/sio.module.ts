import { Module } from '@nestjs/common';
import { SioService } from './sio.service';
import { SioGateway } from './sio.gateway';
import { SessionManager } from './sessions';
import { PushDataService } from './handlers/push-data.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [SioGateway, SioService, SessionManager, PushDataService],
  exports: [SioService, PushDataService],
})
export class SioModule {}
