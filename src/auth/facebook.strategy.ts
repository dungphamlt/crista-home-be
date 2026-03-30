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
      clientID: configService.get<string>("FACEBOOK_APP_ID", ""),
      clientSecret: configService.get<string>("FACEBOOK_APP_SECRET", ""),
      callbackURL: configService.get<string>(
        "FACEBOOK_CALLBACK_URL",
        "https://crista-home-be-production.up.railway.app/auth/facebook/callback",
      ),
      profileFields: ["id", "emails", "name", "displayName"],
      scope: ["email"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: unknown) => void,
  ) {
    const email = profile.emails?.[0]?.value;
    const displayName =
      profile.displayName ||
      [profile.name?.givenName, profile.name?.familyName]
        .filter(Boolean)
        .join(" ");
    try {
      const result = await this.authService.validateOAuthLogin(
        "facebook",
        profile.id,
        email,
        displayName || undefined,
      );
      done(null, result);
    } catch (err) {
      done(err as Error, false);
    }
  }
}
