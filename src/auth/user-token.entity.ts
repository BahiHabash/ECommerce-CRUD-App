import { User } from 'src/user/user.entity';
import { TokenPurpose } from 'src/utils/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'user_tokens' })
export class UserToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ type: 'enum', enum: TokenPurpose })
  purpose: TokenPurpose;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ManyToOne(() => User, (user) => user.tokens, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' }) // <-- Tells TypeORM to create a 'userId' column
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}
