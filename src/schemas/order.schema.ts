import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OrderItem } from './order-item.schema';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  orderCode: string;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerPhone: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop()
  customerAddress: string;

  @Prop({ default: '' })
  note?: string;

  @Prop({ required: true, default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  shippingFee: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop()
  couponCode?: string;

  @Prop({ required: true })
  total: number;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ default: 'cod' })
  paymentMethod: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ orderCode: 1 }, { unique: true });
OrderSchema.index({ customerPhone: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
