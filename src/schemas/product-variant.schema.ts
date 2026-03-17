import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductVariantDocument = ProductVariant & Document;

@Schema({ _id: false })
export class ProductVariant {
  @Prop({ required: true })
  name: string; // e.g. "Đỏ", "Xanh", "Size M"

  @Prop()
  value?: string;

  @Prop()
  image?: string;

  @Prop({ default: 0 })
  stock: number;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);
