import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../schemas/order.schema';
import { CouponService } from '../coupon/coupon.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private couponService: CouponService,
    private emailService: EmailService,
  ) {}

  private generateOrderCode(): string {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `CR${y}${m}${d}${random}`;
  }

  async create(data: {
    items: Array<{
      product: string;
      productName: string;
      variantName?: string;
      price: number;
      quantity: number;
      image?: string;
    }>;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    note?: string;
    shippingFee?: number;
    couponCode?: string;
  }) {
    let orderCode = this.generateOrderCode();
    let exists = await this.orderModel.findOne({ orderCode });
    while (exists) {
      orderCode = this.generateOrderCode();
      exists = await this.orderModel.findOne({ orderCode });
    }

    let subtotal = 0;
    for (const item of data.items) {
      subtotal += item.price * item.quantity;
    }

    let discount = 0;
    if (data.couponCode) {
      const couponResult = await this.couponService.validate(
        data.couponCode,
        subtotal,
      );
      if (couponResult.valid) {
        discount = couponResult.discount;
      }
    }

    const shippingFee = data.shippingFee ?? 0;
    const total = Math.max(0, subtotal + shippingFee - discount);

    const order = await this.orderModel.create({
      orderCode,
      items: data.items,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      customerAddress: data.customerAddress,
      note: data.note,
      subtotal,
      shippingFee,
      discount,
      couponCode: data.couponCode,
      total,
      status: OrderStatus.PENDING,
      paymentMethod: 'cod',
    });

    if (data.couponCode && discount > 0) {
      await this.couponService.applyCoupon(data.couponCode);
    }
    await this.emailService.sendOrderConfirmation(order);

    return order;
  }

  async findAll(page = 1, limit = 20, status?: OrderStatus) {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    return this.orderModel.findById(id).lean().exec();
  }

  async findByOrderCode(orderCode: string) {
    return this.orderModel.findOne({ orderCode }).lean().exec();
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.orderModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .lean()
      .exec();
  }
}
