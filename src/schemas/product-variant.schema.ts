import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductVariantDocument = ProductVariant & Document;

@Schema({ _id: false })
export class ProductVariant {
  @Prop({ required: true })
  name: string; // e.g. "Đỏ", "Xanh", "Size M"

  @Prop()
  value?: string;

  /** Mã SKU riêng của biến thể (VD: 60234-G). Nên unique toàn hệ thống — index ở product.schema */
  @Prop()
  sku?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: 0 })
  stock: number;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);
