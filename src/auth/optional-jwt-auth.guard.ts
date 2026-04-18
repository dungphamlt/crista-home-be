import {
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * If a valid Bearer JWT is present, attaches `req.user` like JwtAuthGuard.
 * Missing or invalid token: continue without user (no 401).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers?: { authorization?: string };
    }>();
    const auth = req.headers?.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return true;
    }
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      return true;
    }
  }

  override handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
  ): TUser | undefined {
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}
