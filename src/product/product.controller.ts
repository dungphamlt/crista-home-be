import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

import { GetRole } from '../auth/get-role.decorator';

@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  findAllAdmin(
    @GetRole() role: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string | string[],
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('isNewArrival') isNewArrival?: string,
  ) {
    const filters: Record<string, any> = {};
    const searchStr = this.normalizeQueryParam(search);
    if (searchStr) filters.search = searchStr;
    if (category) filters.category = category;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isFeatured === 'true') filters.isFeatured = true;
    if (isNewArrival === 'true') filters.isNewArrival = true;

    return this.productService.findAllAdmin(
      parseInt(page, 10),
      parseInt(limit, 10),
      Object.keys(filters).length ? filters : undefined,
      role,
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

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(
    @GetRole() role: string,
    @Query('page') page = '1',
    @Query('limit') limit = '12',
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string | string[],
    @Query('featured') featured?: string,
    @Query('new') isNew?: string,
  ) {
    const filters: Record<string, any> = {};
    if (category) filters.category = category;
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    
    const searchStr = this.normalizeQueryParam(search);
    if (searchStr) filters.search = searchStr;
    if (featured === 'true') filters.isFeatured = true;
    if (isNew === 'true') filters.isNewArrival = true;

    return this.productService.findAll(
      parseInt(page, 10),
      parseInt(limit, 10),
      filters,
      role,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('featured')
  findFeatured(@GetRole() role: string, @Query('limit') limit = '10') {
    return this.productService.findFeatured(parseInt(limit, 10), role);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('new')
  findNew(@GetRole() role: string, @Query('limit') limit = '10') {
    return this.productService.findNew(parseInt(limit, 10), role);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('slug/:slug')
  findBySlug(@GetRole() role: string, @Param('slug') slug: string) {
    return this.productService.findBySlug(slug, role);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@GetRole() role: string, @Param('id') id: string) {
    return this.productService.findOne(id, role);
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
