import { extname } from 'node:path';
import { diskStorage } from 'multer';
import { BadRequestException, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { MulterModule } from '@nestjs/platform-express';
import { User } from './user.entity';
import { UPLOADS_FOLDER_USER_PROFILE } from 'src/utils/constant';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    TypeOrmModule.forFeature([User]),
    MulterModule.register({
      storage: diskStorage({
        destination: UPLOADS_FOLDER_USER_PROFILE,
        filename: (req, file, cb) => {
          if (!file.originalname) {
            return cb(new BadRequestException('No file uploaded.'), '');
          }

          const postfix: string = `${Math.round(Math.random() * 10e5)}-${Date.now()}-profile`;
          const fileExt: string = extname(file.originalname).trim();
          const baseName: string = file.originalname
            .replace(fileExt, '')
            .replace(/\s+/g, '_');

          const fileName: string = `${baseName}-${postfix}${fileExt}`;

          cb(null, fileName);
        },
      }),
      limits: { fileSize: 1024 * 1024 * 5 },
      fileFilter: (req, image, cb) => {
        if (!image.mimetype.startsWith('image')) {
          return cb(
            new BadRequestException('Only image file types are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  ],
  exports: [UserService],
})
export class UserModule {}
