import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { Cache } from 'cache-manager';
import AuthService from '../auth/auth.service';
import addDay from '../helpers/addDay';
import { LoginMetadata } from '../users/users.controller';
import { Repository } from 'typeorm';
import DeviceSessionEntity from './device-session.entity';
import { JwtStrategy } from '../auth/guard/jwt.strategy';
const { randomUUID, randomBytes  } = require('crypto');
const EXP_SESSION = 7; // 1 week
export interface LoginRespionse {
  token: string;
  refreshToken: string;
  expiredAt: Date;
}
@ApiBearerAuth()
@Injectable()
export class DeviceSessionsService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(DeviceSessionEntity)
    private repository: Repository<DeviceSessionEntity>,
    private authService: AuthService,
  ) {}

  generateSecretKey(length = 16): string {
    return randomBytes(length).toString('hex').slice(0, length);
  }

  async logout(userId: string, sessionId: string) {
    const session: any = await this.repository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .select(['session', 'user.id'])
      .where('session.id = :sessionId', { sessionId })
      .getOne();

    if (!session || session.user.id !== userId) {
      throw new ForbiddenException();
    }
    const keyCache = this.authService.getKeyCache(userId, session.deviceId);

    await this.cacheManager.set(keyCache, null);
    await this.repository.delete(sessionId);
    return {
      message: 'Logout success',
      status: 200,
      sessionId,
    };
  }

  async reAuth(
    deviceId: string,
    _refreshToken: string,
  ): Promise<LoginRespionse> {
    const session: any = await this.repository
      .createQueryBuilder('session')
      .select('session', 'user.id')
      .leftJoinAndSelect('session.user', 'user')
      .where('session.refreshToken = :_refreshToken', { _refreshToken })
      .andWhere('session.deviceId = :deviceId', { deviceId })
      .getOne();

    if (
      !session ||
      new Date(session.expiredAt).valueOf() < new Date().valueOf()
    ) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    const payload = {
      id: session.user.id,
      deviceId,
    };

    const secretKey = this.generateSecretKey();
    const [token, refreshToken, expiredAt] = [
      JwtStrategy.generate(payload, secretKey),
      randomBytes(32).toString('hex'),
      addDay(7),
    ];

    await this.repository.update(session.id, {
      secretKey,
      refreshToken,
      expiredAt,
    });
    return { token, refreshToken, expiredAt };
  }

  async handleDeviceSession(
    userId: string,
    metaData: LoginMetadata,
  ): Promise<LoginRespionse> {
    const { deviceId } = metaData;
    const currentDevice = await this.repository.findOne({
      where: { deviceId },
    });

    const expiredAt = addDay(EXP_SESSION);
    const secretKey = this.generateSecretKey();

    const payload = {
      id: userId,
      deviceId,
    };
    const [token, refreshToken] = [
      JwtStrategy.generate(payload, secretKey),
      randomBytes(32).toString('hex'),
    ];

    const deviceName = metaData.deviceId;
    const newDeviceSession = new DeviceSessionEntity();
    newDeviceSession.user = userId;
    newDeviceSession.secretKey = secretKey;
    newDeviceSession.refreshToken = refreshToken;
    newDeviceSession.expiredAt = expiredAt;
    newDeviceSession.deviceId = deviceId;
    newDeviceSession.ipAddress = metaData.ipAddress;
    newDeviceSession.ua = metaData.ua;
    newDeviceSession.name = deviceName;

    // update or create device session
    await this.repository.save({
      id: currentDevice?.id || randomUUID(),
      ...newDeviceSession,
    });
    return { token, refreshToken, expiredAt };
  }

  async getDeviceSessions(userId: string) {
    return this.repository.find({
      where: {
        user: userId,
      },
      select: [
        'id',
        'deviceId',
        'createdAt',
        'ipAddress',
        'name',
        'ua',
        'expiredAt',
        'updatedAt',
      ],
    });
  }
}
