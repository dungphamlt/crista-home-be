import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>("GOOGLE_CLIENT_ID", ""),
      clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET", ""),
      callbackURL: configService.get<string>(
        "GOOGLE_CALLBACK_URL",
        "https://crista-home-be-production.up.railway.app/auth/google/callback",
      ),
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      displayName?: string;
      name?: { givenName?: string; familyName?: string };
      emails?: { value: string }[];
    },
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
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
      );
      done(null, result);
    } catch (err) {
      done(err as Error, false);
    }
  }
}
