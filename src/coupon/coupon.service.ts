import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument } from '../schemas/coupon.schema';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  async validate(
    code: string,
    orderAmount: number,
  ): Promise<{ valid: boolean; discount: number }> {
    const coupon = await this.couponModel.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return { valid: false, discount: 0 };
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return { valid: false, discount: 0 };
    }
    if (coupon.endDate && now > coupon.endDate) {
      return { valid: false, discount: 0 };
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, discount: 0 };
    }
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return { valid: false, discount: 0 };
    }

    let discount = 0;
    if (coupon.type === 'percent') {
      discount = Math.floor((orderAmount * coupon.value) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }

    return { valid: true, discount };
  }

  async applyCoupon(code: string) {
    await this.couponModel.updateOne(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 } },
    );
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.couponModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.couponModel.countDocuments(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data: Partial<Coupon>) {
    if (data.code) {
      data.code = data.code.toUpperCase();
    }
    return this.couponModel.create(data);
  }

  async update(id: string, data: Partial<Coupon>) {
    if (data.code) {
      data.code = data.code.toUpperCase();
    }
    return this.couponModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string) {
    return this.couponModel.findByIdAndDelete(id).exec();
  }
}
