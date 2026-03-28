import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ email });
    if (!user?.password) {
      return null;
    }
    if (await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  issueToken(user: UserDocument) {
    const payload = { sub: String(user._id), email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.issueToken(user);
  }

  async validateOAuthLogin(
    provider: 'google' | 'facebook',
    providerId: string,
    email: string | undefined,
    displayName: string | undefined,
  ) {
    if (!email) {
      throw new UnauthorizedException(
        'Không lấy được email từ tài khoản OAuth. Vui lòng cấp quyền email.',
      );
    }
    const filter =
      provider === 'google' ? { googleId: providerId } : { facebookId: providerId };
    let user = await this.userModel.findOne(filter);
    if (user) {
      return this.issueToken(user);
    }
    user = await this.userModel.findOne({ email });
    if (user) {
      if (provider === 'google') {
        user.googleId = providerId;
      } else {
        user.facebookId = providerId;
      }
      await user.save();
      return this.issueToken(user);
    }
    user = await this.userModel.create({
      email,
      name: displayName || email.split('@')[0],
      role: 'admin',
      ...(provider === 'google' ? { googleId: providerId } : { facebookId: providerId }),
    });
    return this.issueToken(user);
  }

  async createAdmin(email: string, password: string, name?: string) {
    const exists = await this.userModel.findOne({ email });
    if (exists) {
      throw new UnauthorizedException('Email đã tồn tại');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      role: 'admin',
      name: name || 'Admin',
    });
    return { id: user._id, email: user.email, name: user.name };
  }
}
