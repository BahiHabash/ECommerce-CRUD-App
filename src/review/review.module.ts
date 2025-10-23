import { forwardRef, Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { Review } from './review.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { ProductModule } from 'src/product/product.module';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
  imports: [
    TypeOrmModule.forFeature([Review]),
    UserModule,
    forwardRef(() => ProductModule),
  ],
})
export class ReviewModule {}
