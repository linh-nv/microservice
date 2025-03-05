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
  async getAllMessages(username?: string) {
    // Nếu không có username, trả về toàn bộ tin nhắn
    if (!username) {
      return this.chatRepository.find({
        order: { createdAt: 'ASC' },
      });
    }

    // Lấy tin nhắn liên quan đến người dùng (là sender hoặc receiver)
    return this.chatRepository.find({
      where: [{ sender: username }, { receiver: username }],
      order: { createdAt: 'ASC' },
    });
  }
}
