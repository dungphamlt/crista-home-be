import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findAllWithProductCount(parentId?: string) {
    const categories = await this.findAll(parentId);
    const withCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await this.productModel.countDocuments({
          categories: cat._id,
          isActive: true,
        });
        return { ...cat, productCount: count };
      }),
    );
    return withCount;
  }

  async findAll(parentId?: string) {
    const filter: Record<string, unknown> = { isActive: true };
    if (parentId) {
      filter.parent = parentId;
    } else {
      filter.$or = [{ parent: null }, { parent: { $exists: false } }];
    }
    return this.categoryModel
      .find(filter)
      .sort({ order: 1 })
      .lean()
      .exec();
  }

  async findAllAdmin() {
    const list = await this.categoryModel
      .find()
      .populate('parent', 'name slug')
      .lean()
      .exec();
    // Sắp xếp theo cây: cha trước con
    const byParent = new Map<string | null, typeof list>();
    for (const c of list) {
      const pid = c.parent ? String((c.parent as { _id: unknown })._id) : null;
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid)!.push(c);
    }
    const sorted: typeof list = [];
    const add = (parentId: string | null) => {
      const children = byParent.get(parentId) || [];
      children.sort((a, b) => (a.order || 0) - (b.order || 0));
      for (const c of children) {
        sorted.push(c);
        add(String((c as { _id: unknown })._id));
      }
    };
    add(null);
    return sorted;
  }

  async findOne(id: string) {
    return this.categoryModel.findById(id).lean().exec();
  }

  async findBySlug(slug: string) {
    return this.categoryModel.findOne({ slug, isActive: true }).lean().exec();
  }

  async create(data: Partial<Category>) {
    const slug = data.slug || this.slugify(data.name || '');
    return this.categoryModel.create({ ...data, slug });
  }

  async update(id: string, data: Partial<Category>) {
    if (data.name && !data.slug) {
      data.slug = this.slugify(data.name);
    }
    return this.categoryModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string) {
    return this.categoryModel.findByIdAndDelete(id).exec();
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
