import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
import { User, UserDocument } from "../schemas/user.schema";

export type SafeUserView = {
  id: string;
  email: string;
  name?: string;
  role: string;
  avatar?: string;
  googleId?: string;
  facebookId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private toSafeUser(doc: UserDocument): SafeUserView {
    const o = doc.toObject();
    return {
      id: String(o._id),
      email: o.email,
      name: o.name,
      role: o.role,
      avatar: o.avatar,
      googleId: o.googleId,
      facebookId: o.facebookId,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  }

  async findAllForAdmin(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{
    data: SafeUserView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    const filter: Record<string, unknown> = {};
    if (search?.trim()) {
      const esc = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { email: { $regex: esc, $options: "i" } },
        { name: { $regex: esc, $options: "i" } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 0;

    return {
      data: rows.map((d) => this.toSafeUser(d)),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    };
  }

  async findOneForAdmin(id: string): Promise<SafeUserView> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException("ID không hợp lệ");
    }
    const user = await this.userModel.findById(id).select("-password").exec();
    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }
    return this.toSafeUser(user);
  }
}
