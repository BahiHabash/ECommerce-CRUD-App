import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CURRENT_TIMESTAMP } from '../common/utils/constant';
import { Product } from '../product/product.entity';
import { Review } from '../review/review.entity';
import { UserRoleEnum } from 'src/common/utils/enums';
import { Exclude } from 'class-transformer';

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
    enum: UserRoleEnum,
    default: UserRoleEnum.NORMAL_USER,
  })
  role: UserRoleEnum;

  @Column({ type: 'varchar', nullable: true, default: null })
  profileImage: string | null;

  @Column({ default: false })
  isAccountVerified: boolean;

  /**
   * Its value is managed automatically by the UserSubscriber.
   */
  @Column({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  lastSecurityUpdate: Date;

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updatedAt: Date;
}
