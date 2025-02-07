import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class FriendRequestsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string[]>();

  handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      const userSockets = this.userSockets.get(userId) || [];
      userSockets.push(client.id);
      this.userSockets.set(userId, userSockets);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      const userSockets = this.userSockets.get(userId) || [];
      const updatedSockets = userSockets.filter(
        (socketId) => socketId !== client.id,
      );
      if (updatedSockets.length > 0) {
        this.userSockets.set(userId, updatedSockets);
      } else {
        this.userSockets.delete(userId);
      }
    }
  }

  @OnEvent('friendRequest.created')
  handleFriendRequestCreated(payload: {
    requestId: string;
    senderId: string;
    receiverId: string;
  }) {
    const receiverSockets = this.userSockets.get(payload.receiverId);
    if (receiverSockets) {
      receiverSockets.forEach((socketId) => {
        this.server.to(socketId).emit('newFriendRequest', payload);
      });
    }
  }
}
