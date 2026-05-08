// auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "../schemas/user.schema";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    identifier: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user?.password) return null;
    if (await bcrypt.compare(password, user.password)) return user;
    return null;
  }

  issueToken(user: UserDocument) {
    const isSpecialAccount = user.role === "admin" || user.role === "partner";
    const payload = {
      sub: String(user._id),
      email: isSpecialAccount ? undefined : user.email,
      username: user.username,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: String(user._id),
        email: isSpecialAccount ? undefined : user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async login(identifier: string, password: string) {
    const user = await this.validateUser(identifier, password);
    if (!user)
      throw new UnauthorizedException("Email/Username hoặc mật khẩu không đúng");
    return this.issueToken(user);
  }

  // ✅ Thêm register cho user thường
  async register(email: string, password: string, name?: string) {
    const exists = await this.userModel.findOne({ email });
    if (exists) throw new ConflictException("Email đã được sử dụng");
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      email,
      password: hashed,
      name: name || email.split("@")[0],
      role: "user",
    });
    return this.issueToken(user);
  }

  async validateOAuthLogin(
    provider: "google" | "facebook",
    providerId: string,
    email: string | undefined,
    displayName: string | undefined,
    avatar?: string, // ✅ thêm avatar param
  ) {
    if (!email) {
      throw new UnauthorizedException(
        "Không lấy được email từ tài khoản OAuth. Vui lòng cấp quyền email.",
      );
    }

    const filter =
      provider === "google"
        ? { googleId: providerId }
        : { facebookId: providerId };

    let user = await this.userModel.findOne(filter);
    if (user) return this.issueToken(user);

    user = await this.userModel.findOne({ email });
    if (user) {
      if (provider === "google") user.googleId = providerId;
      else user.facebookId = providerId;
      if (avatar && !user.avatar) user.avatar = avatar; // ✅ cập nhật avatar nếu chưa có
      await user.save();
      return this.issueToken(user);
    }

    user = await this.userModel.create({
      email,
      name: displayName || email.split("@")[0],
      role: "user",
      avatar, // ✅ lưu avatar
      ...(provider === "google"
        ? { googleId: providerId }
        : { facebookId: providerId }),
    });
    return this.issueToken(user);
  }

  async createAdmin(username: string, password: string, name?: string) {
    const exists = await this.userModel.findOne({
      $or: [{ email: username }, { username }],
    });
    if (exists) throw new ConflictException("Username hoặc Email đã tồn tại");
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      username,
      password: hashed,
      role: "admin",
      name: name || "Admin",
    });
    return { id: String(user._id), username: user.username, name: user.name };
  }

  async createPartner(data: {
    username: string;
    password: string;
    name?: string;
  }) {
    const { username, password, name } = data;
    const exists = await this.userModel.findOne({
      $or: [{ email: username }, { username }],
    });
    if (exists) throw new ConflictException("Username hoặc Email đã tồn tại");

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      username,
      password: hashed,
      role: "partner",
      name: name || "Partner",
    });
    return {
      id: String(user._id),
      username: user.username,
      name: user.name,
    };
  }
}
