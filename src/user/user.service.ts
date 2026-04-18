import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
import * as bcrypt from "bcrypt";
import { ALL_USER_ROLES } from "../auth/roles";
import { User, UserDocument } from "../schemas/user.schema";

const PASSWORD_MIN_LENGTH = 8;

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

  async updateRoleForAdmin(id: string, role: string): Promise<SafeUserView> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException("ID không hợp lệ");
    }
    const r = typeof role === "string" ? role.trim() : "";
    if (!ALL_USER_ROLES.includes(r as (typeof ALL_USER_ROLES)[number])) {
      throw new BadRequestException(
        `role phải là một trong: ${ALL_USER_ROLES.join(", ")}`,
      );
    }
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: { role: r } }, { new: true })
      .select("-password")
      .exec();
    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }
    return this.toSafeUser(user);
  }

  async updatePasswordForAdmin(
    id: string,
    newPassword: string,
  ): Promise<SafeUserView> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException("ID không hợp lệ");
    }
    const pwd =
      typeof newPassword === "string" ? newPassword.trim() : "";
    if (pwd.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`,
      );
    }
    const hashed = await bcrypt.hash(pwd, 10);
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: { password: hashed } }, { new: true })
      .select("-password")
      .exec();
    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }
    return this.toSafeUser(user);
  }

  /** Admin đăng nhập đổi mật khẩu của chính mình (cần đúng mật khẩu hiện tại). */
  async updateOwnAdminPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<SafeUserView> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException("ID không hợp lệ");
    }
    const cur = typeof currentPassword === "string" ? currentPassword : "";
    const pwd = typeof newPassword === "string" ? newPassword.trim() : "";
    if (cur.length === 0) {
      throw new BadRequestException("Thiếu mật khẩu hiện tại");
    }
    if (pwd.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`,
      );
    }
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }
    if (!user.password) {
      throw new BadRequestException(
        "Tài khoản chưa có mật khẩu đăng nhập (ví dụ đăng nhập OAuth). Liên hệ quản trị để đặt mật khẩu.",
      );
    }
    const match = await bcrypt.compare(cur, user.password);
    if (!match) {
      throw new UnauthorizedException(
        "Mật khẩu hiện tại không đúng",
      );
    }
    const hashed = await bcrypt.hash(pwd, 10);
    const updated = await this.userModel
      .findByIdAndUpdate(userId, { $set: { password: hashed } }, { new: true })
      .select("-password")
      .exec();
    if (!updated) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }
    return this.toSafeUser(updated);
  }

}
