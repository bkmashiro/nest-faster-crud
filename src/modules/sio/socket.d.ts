// socket.d.ts

import { Socket } from 'socket.io';
import { User } from '../user/entities/user.entity';

declare module 'socket.io' {
  interface Socket {
    /**
     * Note that this is appended to the socket object
     */
    user?: User;
  }
}
