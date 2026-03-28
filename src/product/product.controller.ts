import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string | string[],
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('isNewArrival') isNewArrival?: string,
  ) {
    const filters: Record<string, unknown> = {};
    const searchStr = this.normalizeQueryParam(search);
    if (searchStr !== undefined) filters.search = searchStr;
    if (category) filters.category = category;
    if (isActive === 'true') filters.isActive = true;
    if (isActive === 'false') filters.isActive = false;
    if (isFeatured === 'true') filters.isFeatured = true;
    if (isNewArrival === 'true') filters.isNewArrival = true;

    return this.productService.findAllAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      Object.keys(filters).length ? filters : undefined,
    );
  }

  /** Chuẩn hóa query string (Nest có thể trả string | string[]) */
  private normalizeQueryParam(
    v: string | string[] | undefined,
  ): string | undefined {
    if (v === undefined || v === null) return undefined;
    const s = Array.isArray(v) ? v[0] : v;
    const t = typeof s === 'string' ? s.trim() : '';
    return t === '' ? undefined : t;
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string | string[],
    @Query('featured') featured?: string,
    @Query('new') isNew?: string,
  ) {
    const filters: Record<string, unknown> = {};
    if (category) filters.category = category;
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    const searchStr = this.normalizeQueryParam(search);
    if (searchStr !== undefined) filters.search = searchStr;
    if (featured === 'true') filters.isFeatured = true;
    if (isNew === 'true') filters.isNewArrival = true;

    return this.productService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 12,
      filters,
    );
  }

  @Get('featured')
  findFeatured(@Query('limit') limit?: string) {
    return this.productService.findFeatured(limit ? parseInt(limit, 10) : 10);
  }

  @Get('new')
  findNew(@Query('limit') limit?: string) {
    return this.productService.findNew(limit ? parseInt(limit, 10) : 10);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.productService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.productService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }
}
