import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

class LoginDto {
  email: string;
  password: string;
}

class CreateAdminDto {
  email: string;
  password: string;
  name?: string;
}

type OAuthLoginResult = {
  access_token: string;
  user: {
    id: unknown;
    email: string;
    name?: string;
    role: string;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: Request & { user?: OAuthLoginResult },
    @Res({ passthrough: false }) res: Response,
  ) {
    return this.oauthCallbackRedirect(req, res);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {}

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthCallback(
    @Req() req: Request & { user?: OAuthLoginResult },
    @Res({ passthrough: false }) res: Response,
  ) {
    return this.oauthCallbackRedirect(req, res);
  }

  private oauthCallbackRedirect(
    req: Request & { user?: OAuthLoginResult },
    res: Response,
  ) {
    const data = req.user;
    if (!data?.access_token || !data?.user) {
      const frontend = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      return res.redirect(
        `${frontend}/dang-nhap/oauth?error=${encodeURIComponent('oauth_invalid')}`,
      );
    }
    const { access_token, user } = data;
    const userJson = encodeURIComponent(JSON.stringify(user));
    const frontend = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const url =
      `${frontend}/dang-nhap/oauth` +
      `?access_token=${encodeURIComponent(access_token)}` +
      `&user=${userJson}`;
    return res.redirect(302, url);
  }

  @Post('seed-admin')
  async seedAdmin(@Body() dto: CreateAdminDto) {
    return this.authService.createAdmin(dto.email, dto.password, dto.name);
  }
}
