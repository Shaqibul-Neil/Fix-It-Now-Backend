import type { Prisma } from "../../../../generated/prisma/client";

export const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  title: true,
  message: true,
  data: true,
  isRead: true,
  createdAt: true,
} as const satisfies Prisma.NotificationSelect;
