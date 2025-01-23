import { Exclude } from 'class-transformer';
import { RoleType, UserStatus } from 'src/Shared/enums';
import { AbstractEntity } from 'src/Shared/entities/abstract.entity';
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import DeviceSessionEntity from 'src/Modules/device-sessions/device-session.entity';

@Entity({ name: 'users' })
@Index(['email'], { unique: true })
export class UserEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'varchar', name: 'first_name', length: 32 })
  firstName: string;

  @Column({ nullable: false, type: 'varchar', name: 'last_name', length: 32 })
  lastName: string;

  @Column({ unique: false, nullable: false, type: 'varchar', length: 128 })
  email: string;

  @Column({ type: 'enum', enum: RoleType, default: RoleType.USER })
  role: RoleType;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'json' })
  params: Record<string, unknown>;

  @Exclude()
  @Column()
  password: string;

  @Exclude()
  @Column()
  salt: string;

  @OneToMany(() => DeviceSessionEntity, (deviceSessions) => deviceSessions.id)
  deviceSessions: DeviceSessionEntity[];

  get fullName() {
    return this.firstName + ' ' + this.lastName;
  }
}
