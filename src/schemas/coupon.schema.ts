import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  type: 'percent' | 'fixed'; // percent: giảm %, fixed: giảm số tiền cố định

  @Prop({ required: true })
  value: number; // % hoặc số tiền VND

  @Prop({ default: 0 })
  minOrderAmount?: number; // Đơn tối thiểu để áp dụng

  @Prop({ default: null })
  maxDiscount?: number; // Giảm tối đa (cho percent)

  @Prop({ default: 1 })
  usageLimit?: number; // Số lần dùng tối đa

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ default: null })
  startDate?: Date;

  @Prop({ default: null })
  endDate?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
