import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerDocument } from '../schemas/banner.schema';

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
  ) {}

  async findAll() {
    return this.bannerModel
      .find({ isActive: true })
      .sort({ order: 1 })
      .lean()
      .exec();
  }

  async findAllAdmin() {
    return this.bannerModel.find().sort({ order: 1 }).lean().exec();
  }

  async create(data: Partial<Banner>) {
    return this.bannerModel.create(data);
  }

  async update(id: string, data: Partial<Banner>) {
    return this.bannerModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string) {
    return this.bannerModel.findByIdAndDelete(id).exec();
  }
}
