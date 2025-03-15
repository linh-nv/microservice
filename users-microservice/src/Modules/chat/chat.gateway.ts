import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';

// Interface để định nghĩa cấu trúc tin nhắn
interface MessagePayload {
  sender: string;
  receiver: string;
  message: string;
  timestamp?: number;
}

@WebSocketGateway(8080, {
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map lưu trữ kết nối socket của từng người dùng
  private connectedClients = new Map<string, Socket>();

  // Hàng đợi tin nhắn cho từng người dùng
  private messageQueue = new Map<
    string,
    { sender: string; receiver: string; message: string }[]
  >();

  // Bộ đếm tần suất gửi tin nhắn
  private rateLimitMap = new Map<string, number>();

  // Cấu hình giới hạn tin nhắn
  private readonly MAX_MESSAGES = 10;
  private readonly TIME_WINDOW = 1000; // 1 giây

  constructor(private readonly chatService: ChatService) {}

  // Xử lý khi có kết nối mới
  handleConnection(client: Socket) {
    console.log(`New client connected: ${client.id}`);
  }

  // Xử lý khi ngắt kết nối
  handleDisconnect(client: Socket) {
    // Xóa client khỏi danh sách kết nối
    for (const [username, socket] of this.connectedClients.entries()) {
      if (socket.id === client.id) {
        this.connectedClients.delete(username);
        console.log(`Client disconnected: ${username}`);
        break;
      }
    }
    this.broadcastOnlineUsers();
  }

  // Sự kiện người dùng đăng nhập/join
  @SubscribeMessage('join')
  handleJoin(client: Socket, username: string) {
    // Lưu socket của người dùng
    this.connectedClients.set(username, client);
    console.log(`${username} joined`);

    // Phát sóng danh sách người dùng trực tuyến
    this.broadcastOnlineUsers();
  }

  // Phát sóng danh sách người dùng trực tuyến
  private broadcastOnlineUsers() {
    const onlineUsers = Array.from(this.connectedClients.keys());
    this.server.emit('onlineUsers', onlineUsers);
  }

  // Tải tin nhắn cũ
  @SubscribeMessage('loadMessages')
  async loadMessages(client: Socket, payload: any) {
    try {
      let sender: string;
      let receiver: string;

      // Kiểm tra xem payload có phải là mảng không và trích xuất dữ liệu phù hợp
      if (Array.isArray(payload)) {
        [sender, receiver] = payload; // Trích xuất sender và receiver từ mảng
      } else {
        // Trường hợp này là để tương thích ngược nếu có code cũ gọi theo cách cũ
        sender = payload;
        receiver = arguments[2];
      }

      console.log('Loading messages between:', sender, 'and', receiver);

      // Gọi service để lấy tin nhắn
      const messages = await this.chatService.getAllMessages(sender, receiver);

      // Gửi tin nhắn về client
      client.emit('allMessages', messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Gửi thông báo lỗi về client
      client.emit('messageError', {
        message: 'Không thể tải tin nhắn',
        details: error.message,
      });
    }
  }

  // Gửi tin nhắn
  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: MessagePayload) {
    const { sender, receiver, message } = payload;
    const now = Date.now();

    // Kiểm tra tần suất gửi tin nhắn (rate limiting)
    const lastMessageTime = this.rateLimitMap.get(sender) || 0;
    if (
      now - lastMessageTime < this.TIME_WINDOW &&
      this.getQueueSize(sender) >= this.MAX_MESSAGES
    ) {
      console.log(`[Throttled] Message from ${sender} to ${receiver}`);
      this.addToQueue(sender, { sender, receiver, message });
      return;
    }

    // Cập nhật thời gian gửi tin nhắn cuối cùng
    this.rateLimitMap.set(sender, now);

    // Gửi tin nhắn đến người nhận (nếu online)
    const receiverSocket = this.connectedClients.get(receiver);
    if (receiverSocket) {
      receiverSocket.emit('receiveMessage', payload);
    }

    // Thêm tin nhắn vào hàng đợi để lưu
    this.addToQueue(sender, { sender, receiver, message });

    // Lưu tin nhắn vào cơ sở dữ liệu
    await this.batchSaveMessages(sender);
  }

  // Thêm tin nhắn vào hàng đợi
  private addToQueue(
    sender: string,
    message: { sender: string; receiver: string; message: string },
  ) {
    const userQueue = this.messageQueue.get(sender) || [];
    userQueue.push(message);
    this.messageQueue.set(sender, userQueue);
  }

  // Lấy kích thước hàng đợi
  private getQueueSize(sender: string): number {
    return (this.messageQueue.get(sender) || []).length;
  }

  // Lưu tin nhắn theo batch
  private async batchSaveMessages(sender: string) {
    const userQueue = this.messageQueue.get(sender);
    if (!userQueue || userQueue.length === 0) {
      return;
    }

    try {
      // Lưu tin nhắn vào database
      await this.chatService.saveMessages(userQueue);
      console.log(`[Saved] ${userQueue.length} messages for ${sender}`);

      // Xóa hàng đợi sau khi lưu
      this.messageQueue.set(sender, []);
    } catch (error) {
      console.error(`[Error Saving Messages]`, error);
    }
  }
}
