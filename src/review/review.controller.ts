import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Get('product/:productId')
  findByProduct(
    @Param('productId') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewService.findByProduct(
      productId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.reviewService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('product') productId?: string,
  ) {
    return this.reviewService.findAllAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      productId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.reviewService.approve(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.reviewService.delete(id);
  }
}
