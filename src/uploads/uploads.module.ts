import { BadRequestException, Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
  controllers: [UploadsController],
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './images',
        filename: (req, file, cb) => {
          // Validate file
          if (!file.originalname) {
            return cb(new BadRequestException('Invalid file'), '');
          }

          // Generate random suffix
          const postfix: string = `${Math.round(Math.random() * 10e5)}-${Date.now()}`;
          const fileExt: string = extname(file.originalname).trim();
          const baseName: string = file.originalname
            .replace(fileExt, '')
            .replace(/\s+/g, '_');

          const filename = `${baseName}-${postfix}${fileExt}`;
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  ],
})
export class UploadsModule {}
