import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Product, ProductDocument } from "../schemas/product.schema";

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  private async findAllWithAtlasSearch(
    searchTerm: string,
    baseQuery: Record<string, unknown>,
    skip: number,
    limit: number,
    page: number,
  ) {
    const pipeline = [
      {
        $search: {
          index: "product_search",
          text: {
            query: searchTerm,
            path: ["name", "description", "shortDescription", "sku"],
            fuzzy: { maxEdits: 1 },
          },
        },
      },
      { $match: baseQuery },
      {
        $facet: {
          data: [
            { $sort: { order: 1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "categories",
                localField: "categories",
                foreignField: "_id",
                as: "categories",
                pipeline: [{ $project: { name: 1, slug: 1 } }],
              },
            },
            { $unset: ["__v"] },
          ],
          total: [{ $count: "count" }],
        },
      },
    ];

    const result = await this.productModel.aggregate(pipeline as any).exec();
    const data = result[0]?.data || [];
    const total = result[0]?.total?.[0]?.count || 0;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
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
    const searchTerm = filters?.search?.trim();
    const mongoUri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || "";
    const useAtlasSearch = searchTerm && mongoUri.includes("mongodb.net");

    if (useAtlasSearch) {
      return this.findAllWithAtlasSearch(searchTerm!, query, skip, limit, page);
    }
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { shortDescription: { $regex: searchTerm, $options: "i" } },
        { sku: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate("categories", "name slug")
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
    const searchTerm = filters?.search?.trim();
    const mongoUri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || "";
    const useAtlasSearch = searchTerm && mongoUri.includes("mongodb.net");

    if (useAtlasSearch) {
      return this.findAllWithAtlasSearch(searchTerm!, query, skip, limit, page);
    }
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { sku: { $regex: searchTerm, $options: "i" } },
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
        .populate("categories", "name slug")
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
      .populate("categories", "name slug")
      .lean()
      .exec();
  }

  async findBySlug(slug: string) {
    return this.productModel
      .findOne({ slug, isActive: true })
      .populate("categories", "name slug")
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
    const slug = data.slug || this.slugify(data.name || "");
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
