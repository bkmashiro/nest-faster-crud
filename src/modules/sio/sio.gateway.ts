import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { SioService } from './sio.service';
import { PushDataDto } from '../tracker/dto/push-data.dto';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { PushDataService } from './handlers/push-data.service';
import { ROOM_GEO } from './ROOM_GEO';

const logger = new Logger('SIoGateway');
@WebSocketGateway(3001, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class SioGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  constructor(
    private readonly sioService: SioService,
    private readonly pushHandler: PushDataService,
  ) { }

  async handleConnection(socket: any, ...args: any[]) {
    try {
      const user = await this.sioService.getUserFromSocket(socket);
      socket.emit('connected', user);
      socket.user = user;
      await this.sioService.addSocket(user.id, socket);
      socket.join(ROOM_GEO);
      logger.debug(`user connected: ${user.id}`);
    } catch (e) {
      logger.debug(`invalid token: ${e}`);
      socket.emit('connected', 'invalid token');
      socket.disconnect(); // invalid token
    }
  }

  handleDisconnect(client: any) {
    this.sioService.removeSocket(client.user.id);
  }

  afterInit(server: Server) {
    this.sioService.bindServer(server)
  }

  @SubscribeMessage('push-data')
  handlePush(@MessageBody() pushDataDto: PushDataDto): string {
    this.pushHandler.push(pushDataDto)
    // store to storage service

    // forward to upper controller (if any)

    return 'ack';
  }
}
