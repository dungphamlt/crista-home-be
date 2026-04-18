import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/admin.guard";
import { UserService } from "./user.service";

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** CMS: danh sách user (chỉ đọc) + tìm theo email/tên */
  @Get("admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllAdmin(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    return this.userService.findAllForAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  /** CMS: chi tiết một user (chỉ đọc) */
  @Get("admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOneAdmin(@Param("id") id: string) {
    return this.userService.findOneForAdmin(id);
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
