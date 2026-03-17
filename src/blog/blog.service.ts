import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog, BlogDocument } from '../schemas/blog.schema';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
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

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.blogModel
        .find({ isPublished: true })
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.blogModel.countDocuments({ isPublished: true }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllAdmin(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.blogModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title slug isPublished createdAt')
        .lean()
        .exec(),
      this.blogModel.countDocuments(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    return this.blogModel.findById(id).lean().exec();
  }

  async findBySlug(slug: string) {
    return this.blogModel.findOne({ slug, isPublished: true }).lean().exec();
  }

  async findLatest(limit = 5) {
    return this.blogModel
      .find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async create(data: Partial<Blog>) {
    const slug = data.slug || this.slugify(data.title || '');
    return this.blogModel.create({ ...data, slug });
  }

  async update(id: string, data: Partial<Blog>) {
    if (data.title && !data.slug) {
      data.slug = this.slugify(data.title);
    }
    return this.blogModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string) {
    return this.blogModel.findByIdAndDelete(id).exec();
  }
}
