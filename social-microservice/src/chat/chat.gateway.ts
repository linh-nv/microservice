import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(8080, {
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private messageQueue = new Map<
    string,
    { sender: string; message: string }[]
  >(); // Hàng đợi lưu tin nhắn
  private rateLimitMap = new Map<string, number>(); // Tần suất gửi tin nhắn của mỗi user

  private readonly MAX_MESSAGES = 10; // Giới hạn số tin nhắn trong một khoảng thời gian
  private readonly TIME_WINDOW = 1000; // Thời gian giới hạn (1 giây)

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('loadMessages')
  async loadMessages(client: Socket) {
    console.log(`Loading messages for client: ${client.id}`);
    const messages = await this.chatService.getAllMessages();
    client.emit('allMessages', messages);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { sender: string; message: string },
  ) {
    const { sender, message } = payload;
    const now = Date.now();
    const lastMessageTime = this.rateLimitMap.get(sender) || 0;

    // 1. Throttling: Giới hạn tần suất gửi tin nhắn
    if (
      now - lastMessageTime < this.TIME_WINDOW &&
      this.getQueueSize(sender) >= this.MAX_MESSAGES
    ) {
      console.log(`[Throttled] Message from ${sender}: ${message}`);
      this.addToQueue(sender, { sender, message });
      return;
    }

    // Cập nhật thời gian gửi tin nhắn cuối cùng
    this.rateLimitMap.set(sender, now);

    // 2. Gửi tin nhắn đến client khác qua WebSocket
    this.server.emit('receiveMessage', payload);

    // 3. Thêm vào hàng đợi
    this.addToQueue(sender, { sender, message });

    // 4. Batch lưu tin nhắn định kỳ
    await this.batchSaveMessages(sender);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, username: string) {
    console.log(`${username} joined`);
  }

  // Hàm thêm tin nhắn vào hàng đợi
  private addToQueue(
    sender: string,
    message: { sender: string; message: string },
  ) {
    const userQueue = this.messageQueue.get(sender) || [];
    userQueue.push(message);
    this.messageQueue.set(sender, userQueue);
  }

  // Hàm lấy kích thước hàng đợi
  private getQueueSize(sender: string): number {
    return (this.messageQueue.get(sender) || []).length;
  }

  // Hàm batch lưu tin nhắn vào cơ sở dữ liệu
  private async batchSaveMessages(sender: string) {
    const userQueue = this.messageQueue.get(sender);
    if (!userQueue || userQueue.length === 0) {
      return;
    }

    // Lưu tin nhắn vào database thông qua ChatService
    try {
      await this.chatService.saveMessages(userQueue);
      console.log(`[Saved] ${userQueue.length} messages for ${sender}`);
      this.messageQueue.set(sender, []); // Xóa hàng đợi sau khi lưu
    } catch (error) {
      console.error(`[Error Saving Messages]`, error);
    }
  }
}
