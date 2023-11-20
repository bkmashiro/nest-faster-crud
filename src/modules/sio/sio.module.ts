import { Module } from '@nestjs/common';
import { SioService } from './sio.service';
import { SioGateway } from './sio.gateway';
import { SessionManager } from './sessions';
import { PushHandler } from './handlers/pushDataHandler';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [SioGateway, SioService, SessionManager, PushHandler],
  exports: [SioService],
})
export class SioModule {}
