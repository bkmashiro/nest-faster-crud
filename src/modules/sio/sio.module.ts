import { Module } from '@nestjs/common';
import { SioService } from './sio.service';
import { SioGateway } from './sio.gateway';
import { SessionManager } from './sessions';

@Module({
  providers: [SioGateway, SioService, SessionManager]
})
export class SioModule {}
