import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(8080, {
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}
  @WebSocketServer()
  server: Server;

  private activeUsers: Set<string> = new Set();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.activeUsers.delete(client.id);
    this.server.emit('activeUsers', Array.from(this.activeUsers));
  }

  @SubscribeMessage('sendMessage')
  handleMessage(client: Socket, payload: { sender: string; message: string }) {
    console.log('Message received:', payload);
    this.server.emit('receiveMessage', payload);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, username: string) {
    console.log(`${username} joined`);
    this.activeUsers.add(username);
    this.server.emit('activeUsers', Array.from(this.activeUsers));
  }
}
