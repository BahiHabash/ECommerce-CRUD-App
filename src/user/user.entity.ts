import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Product } from '../product/product.entity';
import { Review } from '../review/review.entity';
import { UserRole } from 'src/utils/enums';
import { Exclude } from 'class-transformer';
import { UserToken } from 'src/auth/user-token.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: '250', unique: true })
  email: string;

  @Column({ type: 'varchar', length: '150', nullable: true })
  username: string;

  @Column({ select: false })
  @Exclude()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.NORMAL_USER,
  })
  role: UserRole;

  @Column({ type: 'varchar', nullable: true, default: null })
  profileImage: string | null;

  // Its value is managed automatically by the UserSubscriber.
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastSecurityUpdate: Date;

  @Column({ default: false })
  isAccountVerified: boolean;

  @OneToMany(() => UserToken, (token) => token.user)
  tokens: UserToken[];

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
