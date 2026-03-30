/** Google profile image URLs dùng =s96-c (hoặc s64…) — đổi sang =s400-c cho ảnh rõ hơn. */
export function normalizeGoogleAvatarUrl(
  url: string | undefined,
): string | undefined {
  if (!url) return undefined;
  return url.replace(/=s\d+-c(?=($|[&#?]))/, "=s400-c");
}

/** Ảnh đại diện Facebook qua Graph (width/height) thay vì bản thumbnail từ profile.photos */
export function facebookProfilePictureUrl(facebookUserId: string): string {
  return `https://graph.facebook.com/${facebookUserId}/picture?width=400&height=400`;
}

/** Trả về URL ảnh đủ nét cho API (response login + CMS) */
export function resolveAvatarForApi(
  stored: string | undefined,
  facebookId?: string | null,
): string | undefined {
  if (facebookId) {
    return facebookProfilePictureUrl(facebookId);
  }
  return normalizeGoogleAvatarUrl(stored);
}
