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
  async saveMessage(message: { sender: string; message: string }) {
    const chat = this.chatRepository.create(message);
    return this.chatRepository.save(chat);
  }

  // Lưu nhiều tin nhắn (batch)
  async saveMessages(messages: { sender: string; message: string }[]) {
    const chats = this.chatRepository.create(messages);
    return this.chatRepository.save(chats);
  }

  async getAllMessages() {
    return this.chatRepository.find({
      order: { createdAt: 'ASC' }, // Lấy tin nhắn theo thứ tự thời gian
    });
  }
}
