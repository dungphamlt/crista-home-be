import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { ApiResponse } from '../types';

const UPLOAD_DIR = 'uploads';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname) || '.jpg';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

@Controller('upload')
export class UploadController {
  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Chỉ chấp nhận file ảnh'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): ApiResponse<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Không có file');
    }
    const baseUrl = process.env.API_URL || 'http://localhost:3002';
    const url = `${baseUrl}/${UPLOAD_DIR}/${file.filename}`;
    return {
      success: true,
      data: { url },
    };
  }
}
