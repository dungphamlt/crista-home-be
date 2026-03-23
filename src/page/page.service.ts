import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Page, PageDocument } from '../schemas/page.schema';

@Injectable()
export class PageService {
  constructor(
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
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
      this.pageModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.pageModel.countDocuments(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    return this.pageModel.findById(id).lean().exec();
  }

  async findBySlug(slug: string) {
    return this.pageModel.findOne({ slug }).lean().exec();
  }

  async create(data: Partial<Page>) {
    const slug = data.slug || this.slugify(data.name || '');
    return this.pageModel.create({ ...data, slug });
  }

  async update(id: string, data: Partial<Page>) {
    if (data.name && !data.slug) {
      data.slug = this.slugify(data.name);
    }
    return this.pageModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string) {
    return this.pageModel.findByIdAndDelete(id).exec();
  }
}
