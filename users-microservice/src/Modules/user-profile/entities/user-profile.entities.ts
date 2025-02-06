import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AbstractEntity } from 'src/Shared/entities/abstract.entity';
import { UserEntity } from 'src/Modules/users/entities/User';

@Entity({ name: 'user_profiles' })
export class UserProfileEntity extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  avatarUrl: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true, type: 'date' })
  birthday: Date;

  @Column({ nullable: true, type: 'varchar', length: 50 })
  location: string;

  @OneToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity;

  @ManyToMany(() => UserEntity)
  @JoinTable({
    name: 'user_friends',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'friend_id',
      referencedColumnName: 'id',
    },
  })
  friends: UserEntity[];
}
