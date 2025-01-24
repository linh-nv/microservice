import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './typeorm/entities/Payment';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { Chat } from './chat/entities/chat.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
        database: process.env.DATABASE_NAME || 'social_media_db',
        username: process.env.DATABASE_USER || 'testuser',
        password: process.env.DATABASE_PASSWORD || 'testuser123',
        entities: [Chat],
        synchronize: true,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    PaymentsModule,
    ChatModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
