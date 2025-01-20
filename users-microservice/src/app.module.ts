import { forwardRef, Module } from '@nestjs/common';
import { UsersModule } from './Modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './Modules/users/entities/User';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DATABASE_HOST || 'mysql_db',
        port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
        username: process.env.DATABASE_USER || 'testuser',
        password: process.env.DATABASE_PASSWORD || 'testuser123',
        database: process.env.DATABASE_NAME || 'users_db',
        entities: [UserEntity],
        synchronize: true,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
