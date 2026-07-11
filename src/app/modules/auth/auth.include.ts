import type { Prisma } from "../../../../generated/prisma/client";

// user reload on refresh-token (internal → jwt payload)
export const AUTH_REFRESH_SELECT = {
  id: true,
  email: true,
  role: true,
  status: true,
} as const satisfies Prisma.UserSelect;

// current authenticated user (client-facing)
export const AUTH_CURRENT_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  status: true,
} as const satisfies Prisma.UserSelect;
