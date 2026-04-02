import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { ProductVariant } from "./product-variant.schema";

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  slug: string;

  @Prop()
  description?: string;

  @Prop()
  shortDescription?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  /** URL ảnh bìa / hero (tùy chọn; gallery vẫn dùng `images`) */
  @Prop()
  coverImage?: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ default: 0 })
  compareAtPrice?: number;

  @Prop({ type: [Types.ObjectId], ref: "Category", default: [] })
  categories: Types.ObjectId[];

  @Prop({ type: [ProductVariant], default: [] })
  variants: ProductVariant[];

  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isNewArrival: boolean;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: 0 })
  soldCount: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ sku: 1 }, { sparse: true });
/** Mỗi mã variant (VD: 60234-G) chỉ xuất hiện một lần trong DB */
ProductSchema.index({ "variants.sku": 1 }, { unique: true, sparse: true });
ProductSchema.index({ categories: 1 });
ProductSchema.index({ price: 1 });
