import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) {}

  // Lưu một tin nhắn
  async saveMessage(message: {
    sender: string;
    receiver: string;
    message: string;
  }) {
    const chat = this.chatRepository.create(message);
    return this.chatRepository.save(chat);
  }

  // Lưu nhiều tin nhắn (batch)
  async saveMessages(
    messages: {
      sender: string;
      receiver: string;
      message: string;
    }[],
  ) {
    const chats = this.chatRepository.create(messages);
    return this.chatRepository.save(chats);
  }

  // Lấy tất cả tin nhắn, có thể lọc theo username
  async getAllMessages(sender: string, receiver: string) {
    // Kiểm tra và log thông tin đầu vào
    console.log('Getting chat messages. Sender:', sender, 'Receiver:', receiver);
    
    if (!sender || !receiver) {
      console.warn('Missing sender or receiver in getAllMessages');
      return []; // Trả về mảng rỗng nếu thiếu thông tin
    }
    
    try {
      // Tìm tin nhắn hai chiều - cả tin nhắn gửi và nhận
      const messages = await this.chatRepository.find({
        where: [
          { sender: sender, receiver: receiver },
          { sender: receiver, receiver: sender }
        ],
        order: { createdAt: 'ASC' },
      });
      
      console.log(`Found ${messages.length} messages between ${sender} and ${receiver}`);
      return messages;
    } catch (error) {
      console.error('Database error in getAllMessages:', error);
      throw error; // Ném lỗi để xử lý ở mức cao hơn
    }
  }
}
