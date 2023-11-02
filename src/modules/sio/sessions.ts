import { Socket } from "socket.io"

export class SessionManager {
  constructor() { }
  /**
     * Map from user id to socket id
     */
  private userToSocketMap: Map<number, Socket> = new Map()

  /**
   * Map from socket id to user id
   */
  private socketToUserMap: Map<Socket, number> = new Map()

  set(user: number, socket: Socket) {
    this.userToSocketMap.set(user, socket)
    this.socketToUserMap.set(socket, user)
  }

  delete(user: number) {
    const socket = this.userToSocketMap.get(user)
    this.userToSocketMap.delete(user)
    this.socketToUserMap.delete(socket)
  }

  clear() {
    this.userToSocketMap.clear()
    this.socketToUserMap.clear()
  }

  getSocket(user: number): Socket | undefined {
    return this.userToSocketMap.get(user)
  }
}
