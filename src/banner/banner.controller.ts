import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('banners')
export class BannerController {
  constructor(private bannerService: BannerService) {}

  @Get()
  findAll() {
    return this.bannerService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllAdmin() {
    return this.bannerService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.bannerService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.bannerService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.bannerService.delete(id);
  }
}
