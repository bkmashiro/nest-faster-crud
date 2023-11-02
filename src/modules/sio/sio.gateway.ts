import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { SioService } from './sio.service';
import { PushDataDto } from './dto/push-data.dto';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';

const logger = new Logger('SIoGateway');
@WebSocketGateway()
export class SioGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  constructor(private readonly sioService: SioService) { }
  async handleConnection(socket: any, ...args: any[]) {
    try {
      const user = await this.sioService.getUserFromSocket(socket);
      socket.emit('connected', user);
      socket.user = user;
      await this.sioService.addSocket(user.id, socket);
      logger.debug(`user connected: ${user.id}`);
    } catch (e) {
      logger.debug(`invalid token: ${e}`);
      socket.emit('connected', 'invalid token');
      socket.disconnect(); // invalid token
    }
    throw new Error('Method not implemented.');
  }

  handleDisconnect(client: any) {
    throw new Error('Method not implemented.');
  }

  afterInit(server: Server) {
    this.sioService.bindServer(server)
  }

  @SubscribeMessage('push-data')
  handlePush(@MessageBody() data: PushDataDto): string {
    // store to storage service

    // forward to upper controller (if any)

    return '';
  }
}
