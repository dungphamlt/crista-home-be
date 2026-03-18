import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async findAllAdmin(
    page = 1,
    limit = 50,
    filters?: {
      search?: string;
      category?: string;
      isActive?: boolean;
      isFeatured?: boolean;
      isNewArrival?: boolean;
    },
  ) {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (filters?.category) {
      query.categories = filters.category;
    }
    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    if (filters?.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }
    if (filters?.isNewArrival !== undefined) {
      query.isNewArrival = filters.isNewArrival;
    }
    if (filters?.search && filters.search.trim()) {
      const term = filters.search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { shortDescription: { $regex: term, $options: 'i' } },
        { sku: { $regex: term, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('categories', 'name slug')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(query),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAll(
    page = 1,
    limit = 12,
    filters?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
      isFeatured?: boolean;
      isNewArrival?: boolean;
    },
  ) {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { isActive: true };

    if (filters?.category) {
      query.categories = filters.category;
    }
    if (filters?.minPrice) {
      query.price = { ...(query.price as object), $gte: filters.minPrice };
    }
    if (filters?.maxPrice) {
      query.price = { ...(query.price as object), $lte: filters.maxPrice };
    }
    if (filters?.search && filters.search.trim()) {
      const term = filters.search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { sku: { $regex: term, $options: 'i' } },
      ];
    }
    if (filters?.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }
    if (filters?.isNewArrival !== undefined) {
      query.isNewArrival = filters.isNewArrival;
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('categories', 'name slug')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return this.productModel
      .findById(id)
      .populate('categories', 'name slug')
      .lean()
      .exec();
  }

  async findBySlug(slug: string) {
    return this.productModel
      .findOne({ slug, isActive: true })
      .populate('categories', 'name slug')
      .lean()
      .exec();
  }

  async findFeatured(limit = 10) {
    return this.productModel
      .find({ isActive: true, isFeatured: true })
      .sort({ soldCount: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findNew(limit = 10) {
    return this.productModel
      .find({ isActive: true, isNewArrival: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async create(data: Partial<Product>) {
    const slug = data.slug || this.slugify(data.name || '');
    return this.productModel.create({ ...data, slug });
  }

  async update(id: string, data: Partial<Product>) {
    if (data.name && !data.slug) {
      data.slug = this.slugify(data.name);
    }
    return this.productModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string) {
    return this.productModel.findByIdAndDelete(id).exec();
  }
}
