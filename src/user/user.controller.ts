import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";
import { AuthService } from "../auth/auth.service";
import { UserService, PASSWORD_MIN_LENGTH } from "./user.service";

type AdminJwtRequest = {
  user: { id: unknown; email?: string; username?: string; role: string };
};

@Controller("users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  /** CMS: tạo tài khoản admin — body `{ username, password, name? }` */
  @Post("admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  createAdmin(
    @Body() body: { username: string; password: string; name?: string },
  ) {
    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    const pwd = typeof body.password === "string" ? body.password.trim() : "";
    const name =
      typeof body.name === "string" && body.name.trim() !== ""
        ? body.name.trim()
        : undefined;
    if (!username) {
      throw new BadRequestException("Thiếu username");
    }
    if (pwd.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`,
      );
    }
    return this.authService.createAdmin(username, pwd, name);
  }

  /** CMS: tạo tài khoản partner — body `{ email, password, name? }` */
  @Post("partner")
  @UseGuards(JwtAuthGuard, AdminGuard)
  createPartner(
    @Body() body: { email: string; password: string; name?: string },
  ) {
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const pwd = typeof body.password === "string" ? body.password.trim() : "";
    const name =
      typeof body.name === "string" && body.name.trim() !== ""
        ? body.name.trim()
        : undefined;
    if (!email) {
      throw new BadRequestException("Thiếu email");
    }
    if (pwd.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`,
      );
    }
    return this.authService.createPartner(email, pwd, name);
  }

  /** CMS: danh sách khách / partner (role `user` | `partner`) + tìm theo email/tên */
  @Get("admin/users")
  @UseGuards(JwtAuthGuard, AdminGuard)
  findUsersForAdmin(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    return this.userService.findUsersForAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  /** CMS: danh sách tài khoản admin + tìm theo email/tên */
  @Get("admin/admins")
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAdminsForAdmin(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    return this.userService.findAdminsForAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  /** CMS: thông tin admin đang đăng nhập (JWT) */
  @Get("admin/me")
  @UseGuards(JwtAuthGuard, AdminGuard)
  getMeAdmin(@Req() req: AdminJwtRequest) {
    return this.userService.findOneForAdmin(String(req.user.id));
  }

  /** CMS: chi tiết một user (chỉ đọc) */
  @Get("admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOneAdmin(@Param("id") id: string) {
    return this.userService.findOneForAdmin(id);
  }

  /** CMS: admin đổi mật khẩu của chính mình — body `{ currentPassword, newPassword }` */
  @Patch("admin/me/password")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateMyPasswordAdmin(
    @Req() req: AdminJwtRequest,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.userService.updateOwnAdminPassword(
      String(req.user.id),
      body.currentPassword,
      body.newPassword,
    );
  }

  /** CMS: set user password — body `{ password }`, min 8 chars */
  @Patch("admin/:id/password")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updatePasswordAdmin(
    @Param("id") id: string,
    @Body() body: { password: string },
  ) {
    return this.userService.updatePasswordForAdmin(id, body.password);
  }

  /** CMS: đặt role (user | admin | partner) */
  @Patch("admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateRoleAdmin(
    @Param("id") id: string,
    @Body() body: { role: string },
  ) {
    return this.userService.updateRoleForAdmin(id, body.role);
  }
}
