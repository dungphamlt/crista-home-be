import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { OrderDocument } from '../schemas/order.schema';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter() {
    if (this.transporter) return this.transporter;
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      console.warn('Gmail SMTP not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.');
      return null;
    }
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
    return this.transporter;
  }

  async sendOrderConfirmation(order: OrderDocument) {
    const transporter = this.getTransporter();
    if (!transporter) return;

    const itemsHtml = order.items
      .map(
        (i) =>
          `<tr><td>${i.productName} ${i.variantName || ''}</td><td>${i.quantity}</td><td>${(i.price * i.quantity).toLocaleString('vi-VN')} đ</td></tr>`,
      )
      .join('');

    const html = `
      <h2>Xác nhận đơn hàng #${order.orderCode}</h2>
      <p>Xin chào ${order.customerName},</p>
      <p>Cảm ơn bạn đã đặt hàng tại Crista Home. Đơn hàng của bạn đã được tiếp nhận.</p>
      <h3>Thông tin đơn hàng</h3>
      <table border="1" cellpadding="8" style="border-collapse: collapse;">
        <tr><th>Sản phẩm</th><th>Số lượng</th><th>Thành tiền</th></tr>
        ${itemsHtml}
      </table>
      <p><strong>Tạm tính:</strong> ${order.subtotal.toLocaleString('vi-VN')} đ</p>
      <p><strong>Phí vận chuyển:</strong> ${order.shippingFee.toLocaleString('vi-VN')} đ</p>
      <p><strong>Giảm giá:</strong> -${order.discount.toLocaleString('vi-VN')} đ</p>
      <p><strong>Tổng cộng:</strong> ${order.total.toLocaleString('vi-VN')} đ</p>
      <p><strong>Địa chỉ giao hàng:</strong> ${order.customerAddress}</p>
      <p><strong>Số điện thoại:</strong> ${order.customerPhone}</p>
      <p>Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
      <p>Trân trọng,<br>Crista Home</p>
    `;

    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: order.customerEmail,
        subject: `[Crista Home] Xác nhận đơn hàng #${order.orderCode}`,
        html,
      });
    } catch (err) {
      console.error('Failed to send order confirmation email:', err);
    }
  }
}
