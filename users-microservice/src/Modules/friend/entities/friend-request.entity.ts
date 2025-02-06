import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractEntity } from 'src/Shared/entities/abstract.entity';
import { UserEntity } from 'src/Modules/users/entities/User';

export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity({ name: 'friend_requests' })
export class FriendRequestEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'receiver_id' })
  receiver: UserEntity;

  @Column({
    type: 'enum',
    enum: FriendRequestStatus,
    default: FriendRequestStatus.PENDING,
  })
  status: FriendRequestStatus;
}
