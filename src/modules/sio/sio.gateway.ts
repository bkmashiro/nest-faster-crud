import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { SioService } from './sio.service';

@WebSocketGateway()
export class SioGateway {
  constructor(private readonly sioService: SioService) {}

}
