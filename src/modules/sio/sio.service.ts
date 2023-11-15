import { Injectable } from '@nestjs/common';
import { TrackerService } from '../tracker/tracker.service';
import { AuthService } from '../auth/auth.service';
import { Server, Socket } from 'socket.io';
import { SessionManager } from './sessions';
import { DEFAULT_ROOM } from './tokens';
import { PushDataDto } from '../tracker/dto/push-data.dto';

@Injectable()
export class SioService {
  private server: Server = null

  constructor(
    private readonly authService: AuthService,
    private readonly sessions: SessionManager,
    private readonly trackerService: TrackerService,
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
    // connect this socket to rooms that this user joined
    // Note: this won't cause duplicated join, socket.io will handle this
    // even a user went offline and online again, this won't cause duplicated join, and he's auto reconnected to all rooms
    const user = socket.user
    if (user) {
      const groups = await user.joinedChatGroups
      for (const group of groups) {
        socket.join(`group:${group.id}`)
        console.log(`user ${user.id} joined group ${group.id}`)
      }
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
