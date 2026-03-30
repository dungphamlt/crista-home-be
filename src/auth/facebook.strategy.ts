import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, Profile } from "passport-facebook";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, "facebook") {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      clientID: configService.getOrThrow<string>("FACEBOOK_APP_ID"), // ✅ bỏ hardcode fallback
      clientSecret: configService.getOrThrow<string>("FACEBOOK_APP_SECRET"), // ✅ bỏ hardcode fallback
      callbackURL: configService.getOrThrow<string>("FACEBOOK_CALLBACK_URL"), // ✅ bỏ hardcode fallback
      profileFields: ["id", "emails", "name", "displayName", "photos"], // ✅ thêm "photos" để lấy avatar
      // Facebook yêu cầu public_profile kèm email; chỉ "email" dễ lỗi Invalid Scopes
      scope: ["email", "public_profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: unknown) => void,
  ) {
    const email = profile.emails?.[0]?.value;
    const avatar = profile.photos?.[0]?.value; // ✅ lấy avatar

    const displayName =
      profile.name?.givenName && profile.name?.familyName
        ? `${profile.name.givenName} ${profile.name.familyName}` // ✅ ưu tiên ghép givenName + familyName
        : profile.displayName || undefined;

    try {
      const result = await this.authService.validateOAuthLogin(
        "facebook",
        profile.id,
        email,
        displayName,
        avatar, // ✅ truyền avatar
      );
      done(null, result);
    } catch (err) {
      done(err as Error, false);
    }
  }
}
