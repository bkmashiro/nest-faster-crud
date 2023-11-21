import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { Server, Socket } from 'socket.io';
import { SessionManager } from './sessions';
import { DEFAULT_ROOM } from './tokens';


@Injectable()
export class SioService {
  private server: Server = null

  constructor(
    private readonly authService: AuthService,
    private readonly sessions: SessionManager,
  ) { }

  getJwtTokenFromSocket(socket: Socket) {
    return socket.handshake.headers.authorization || socket.handshake.auth.token;
  }

  async getUserFromSocket(socket: Socket) {
    return await this.authService.getUserByToken(this.getJwtTokenFromSocket(socket));
  }

  async addSocket(id: number, socket: Socket) {
    // if already exist, disconnect the old one
    const oldSocket = this.sessions.getSocket(id)
    if (oldSocket) {
      oldSocket.disconnect()
    }
    this.sessions.set(id, socket)
    socket.join(DEFAULT_ROOM) // join default room
  }

  removeSocket(id: number) {
    this.sessions.getSocket(id)?.disconnect() //TODO: check if this is necessary
    this.sessions.delete(id)
  }

  async broadcastToGroup(group: string, event: string, data: any) {
    this.server.to(group).emit(event, data)
  }

  bindServer(server) {
    this.server = server
  }
}
