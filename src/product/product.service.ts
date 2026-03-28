import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Product, ProductDocument } from "../schemas/product.schema";

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /** Tìm theo từng từ (AND): mỗi từ phải khớp ít nhất một trong các field */
  private applyRegexSearch(
    query: Record<string, unknown>,
    searchTerm: string,
    includeShortDescription = true,
  ) {
    const words = searchTerm.split(/\s+/).filter(Boolean);
    const fieldOrs = (word: string) => {
      const esc = this.escapeRegex(word);
      const or: Record<string, unknown>[] = [
        { name: { $regex: esc, $options: "i" } },
        { description: { $regex: esc, $options: "i" } },
      ];
      if (includeShortDescription) {
        or.push({ shortDescription: { $regex: esc, $options: "i" } });
      }
      or.push({ sku: { $regex: esc, $options: "i" } });
      return { $or: or };
    };
    if (words.length === 0) return;
    if (words.length === 1) {
      Object.assign(query, fieldOrs(words[0]));
    } else {
      query.$and = words.map((w) => fieldOrs(w));
    }
  }

  private shouldUseAtlasSearch(): boolean {
    if (process.env.USE_ATLAS_SEARCH === "true") return true;
    if (process.env.USE_ATLAS_SEARCH === "false") return false;
    const uri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || "";
    return uri.includes("mongodb.net");
  }

  private async findAllWithAtlasSearch(
    searchTerm: string,
    baseQuery: Record<string, unknown>,
    skip: number,
    limit: number,
    page: number,
  ) {
    /** Không index search theo description: HTML dài dễ trùng từ ngẫu nhiên → kết quả nhiễu */
    const pathsAll = ["name", "sku"];
    const words = searchTerm.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    /**
     * Mỗi từ phải xuất hiện (AND) trong ít nhất một field đã index.
     * Không dùng fuzzy: fuzzy làm khớp nhầm (vd: sản phẩm không liên quan).
     * Không dùng một cụm text + fuzzy cho cả chuỗi (kể cả 1 từ): dễ nhiễu.
     */
    const searchStage = {
      $search: {
        index: "product_search",
        compound: {
          must: words.map((word) => ({
            text: {
              query: word,
              path: pathsAll,
            },
          })),
        },
      },
    };

    const pipeline = [
      searchStage,
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
    const useAtlasSearch = searchTerm && this.shouldUseAtlasSearch();

    if (useAtlasSearch) {
      return this.findAllWithAtlasSearch(searchTerm!, query, skip, limit, page);
    }
    if (searchTerm) {
      this.applyRegexSearch(query, searchTerm);
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
    const useAtlasSearch = searchTerm && this.shouldUseAtlasSearch();

    if (useAtlasSearch) {
      return this.findAllWithAtlasSearch(searchTerm!, query, skip, limit, page);
    }
    if (searchTerm) {
      this.applyRegexSearch(query, searchTerm, true);
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
