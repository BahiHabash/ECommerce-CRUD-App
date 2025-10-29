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
  UploadedFiles,
  Delete,
  ConflictException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Express, Response } from 'express';
import fs, { promises as fsPromises } from 'node:fs';
import { join } from 'node:path';

@Controller('api/uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    console.log(file);
    return {
      message: 'File uploaded successfully',
      filename: file.filename,
    };
  }

  @Post('multiple-files')
  @UseInterceptors(FilesInterceptor('files'))
  uploadMultipleFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files?.length) throw new BadRequestException('No file uploaded');
    console.log(files);
    return {
      message: 'Files uploaded successfully',
      filesName: files.map((file) => file.filename),
    };
  }

  @Get(':imageName')
  getUploadedFile(@Param('imageName') imageName: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'images', imageName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    return res.sendFile(filePath);
  }

  @Delete(':imageName')
  async deleteUploadedFile(@Param('imageName') imageName: string) {
    const imagePath = join(process.cwd(), 'images', imageName);

    try {
      await fsPromises.unlink(imagePath);
    } catch {
      console.error(
        `Failed to delete file: ${imageName}, At Path: ${imagePath}`,
      );
      throw new ConflictException('Failed to delete that file');
    }

    return { message: 'File Deleted Successfully.' };
  }
}
