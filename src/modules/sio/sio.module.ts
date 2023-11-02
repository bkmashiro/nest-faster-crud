import { Module } from '@nestjs/common';
import { SioService } from './sio.service';
import { SioGateway } from './sio.gateway';

@Module({
  providers: [SioGateway, SioService]
})
export class SioModule {}
