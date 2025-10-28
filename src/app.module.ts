import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ReviewModule } from './review/review.module';
import { ProductModule } from './product/product.module';
import { Product } from './product/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './user/user.entity';
import { Review } from './review/review.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { UserSubscriber } from './subscriber/user.subscriber';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: process.env.NODE_ENV === 'development',
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),

    JwtModule.registerAsync({
      global: true,

      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN'),
        },
      }),
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory(config: ConfigService) {
        return {
          type: 'postgres',
          database: config.get<string>('DB_DATABASE'),
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          port: config.get<number>('DB_PORT'),
          host: config.get<string>('DB_HOST', 'localhost'),
          synchronize: process.env.NODE_ENV !== 'production', // true in Dev onllllly because it doesn't make migration
          entities: [User, Review, Product],
          subscribers: [UserSubscriber],
        };
      },
    }),

    AuthModule,
    UserModule,
    ReviewModule,
    ProductModule,
    UploadsModule,
  ],

  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
