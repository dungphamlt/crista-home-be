// google.strategy.ts
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback, Profile } from "passport-google-oauth20"; // ✅ import Profile
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { normalizeGoogleAvatarUrl } from "./utils/avatar-url.util";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      clientID: configService.getOrThrow<string>("GOOGLE_CLIENT_ID"),
      clientSecret: configService.getOrThrow<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL: configService.getOrThrow<string>("GOOGLE_CALLBACK_URL"), // ✅ bỏ hardcode fallback
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile, // ✅ dùng type từ thư viện
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    const avatar = normalizeGoogleAvatarUrl(profile.photos?.[0]?.value);
    const displayName =
      profile.name?.givenName && profile.name?.familyName
        ? `${profile.name.givenName} ${profile.name.familyName}`
        : profile.displayName;

    try {
      const result = await this.authService.validateOAuthLogin(
        "google",
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
