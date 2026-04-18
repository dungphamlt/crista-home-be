/** User roles stored in `User.role` */
export const UserRole = {
  User: "user",
  Admin: "admin",
  Partner: "partner",
} as const;

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];

export const ALL_USER_ROLES: UserRoleValue[] = [
  UserRole.User,
  UserRole.Admin,
  UserRole.Partner,
];

/** Admin (CMS) and partner (storefront) may see wholesale fields on products */
export function canViewPartnerProductPricing(role?: string | null): boolean {
  return role === UserRole.Admin || role === UserRole.Partner;
}
