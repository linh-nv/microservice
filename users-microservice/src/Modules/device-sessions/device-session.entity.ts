import { UserEntity } from "../users/entities/User";
import {
  Column,
  Entity,
  Generated,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('device-session')
export default class DeviceSessionEntity {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  id: string;
  @Column({ unique: true })
  deviceId: string;
  @Column({ nullable: true })
  name: string;
  @Column()
  ua: string;
  @Column()
  secretKey: string;
  @Column()
  refreshToken: string;
  @Column()
  expiredAt: Date;
  @Column()
  ipAddress: string;
  @Column({ default: true })
  isActive: boolean;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @ManyToOne(() => UserEntity, (user) => user.id)
  user: UserEntity;
}
