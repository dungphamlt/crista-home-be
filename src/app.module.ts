import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { CouponModule } from './coupon/coupon.module';
import { ReviewModule } from './review/review.module';
import { BlogModule } from './blog/blog.module';
import { PageModule } from './page/page.module';
import { BannerModule } from './banner/banner.module';
import { EmailModule } from './email/email.module';
import { UploadModule } from './upload/upload.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/crista-home',
    ),
    AuthModule,
    CategoryModule,
    ProductModule,
    OrderModule,
    CouponModule,
    ReviewModule,
    BlogModule,
    PageModule,
    BannerModule,
    EmailModule,
    UploadModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
