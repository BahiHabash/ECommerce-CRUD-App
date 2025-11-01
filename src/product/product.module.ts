import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { ReviewModule } from 'src/review/review.module';
import { forwardRef } from '@nestjs/common';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  imports: [
    TypeOrmModule.forFeature([Product]),
    forwardRef(() => ReviewModule),
    UserModule,
  ],
  exports: [ProductService],
})
export class ProductModule {}
