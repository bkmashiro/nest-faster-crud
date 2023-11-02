import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { SioService } from './sio.service';
import { PushDataDto } from './dto/push-data.dto';

@WebSocketGateway()
export class SioGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  constructor(private readonly sioService: SioService) { }
  handleConnection(client: any, ...args: any[]) {
    // validate token
    throw new Error('Method not implemented.');
  }
  
  handleDisconnect(client: any) {
    throw new Error('Method not implemented.');
  }

  afterInit(server: any) {
    throw new Error('Method not implemented.');
  }

  @SubscribeMessage('push-data')
  handlePush(@MessageBody() data: PushDataDto): string {
    // store to storage service

    // forward to upper controller (if any)

    return '';
  }
}
