import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async findByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.reviewModel
        .find({ product: productId, isApproved: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.reviewModel.countDocuments({ product: productId, isApproved: true }),
    ]);
    const avg = await this.reviewModel
      .aggregate([
        { $match: { product: productId, isApproved: true } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ])
      .exec();
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      averageRating: avg[0]?.avg ?? 0,
      totalReviews: avg[0]?.count ?? 0,
    };
  }

  async create(data: Partial<Review>) {
    return this.reviewModel.create(data);
  }

  async findAllAdmin(page = 1, limit = 20, productId?: string) {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (productId) filter.product = productId;

    const [data, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('product', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.reviewModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approve(id: string) {
    return this.reviewModel
      .findByIdAndUpdate(id, { $set: { isApproved: true } }, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string) {
    return this.reviewModel.findByIdAndDelete(id).exec();
  }
}
