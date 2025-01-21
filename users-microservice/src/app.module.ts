import { forwardRef, Module } from '@nestjs/common';
import { UsersModule } from './Modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './Modules/users/entities/User';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DeviceSessionsModule } from './Modules/device-sessions/device-sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: "mysql",
        host: process.env.DATABASE_HOST || "localhost",
        port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
        database: process.env.DATABASE_NAME || "users_db",
        username: process.env.DATABASE_USER || "testuser",
        password: process.env.DATABASE_PASSWORD || "testuser123",
        entities: [UserEntity],
        synchronize: true,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule),
    forwardRef(() => DeviceSessionsModule),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
