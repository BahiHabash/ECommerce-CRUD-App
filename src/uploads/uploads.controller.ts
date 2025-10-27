import {
  Controller,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Post,
  Param,
  Res,
  Get,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express, Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import fs from 'fs';

@Controller('api/uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './images',
        filename: (req, file, cb) => {
          // Validate file
          if (!file.originalname) {
            return cb(new BadRequestException('Invalid file'), '');
          }

          // Generate random suffix
          const postfix = `${Math.round(Math.random() * 10 ** 6)}-${Date.now()}`;
          const fileExt = extname(file.originalname);
          const baseName = file.originalname
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
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    console.log('Uploaded file:', file);

    return {
      message: 'File uploaded successfully',
      filename: file.filename,
      path: `/images/${file.filename}`,
    };
  }

  // @Get(':image')
  // getUploadedFile(@Param('image') image: string, @Res() res: Response) {
  //   return res.sendFile(image, { root: 'images' });
  // }

  @Get(':imageName')
  getUploadedFile(@Param('imageName') imageName: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'images', imageName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    return res.sendFile(filePath);
  }
}
