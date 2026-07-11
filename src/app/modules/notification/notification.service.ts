import type { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { getPagination } from "../../../utils/utils";
import { NOTIFICATION_SELECT } from "./notification.include";
import type { TListNotificationsQuery } from "./notification.validation";

export class NotificationService {
  //Mark as read
  private async markAsRead(
    where: Prisma.NotificationWhereInput,
  ): Promise<{ updated: number }> {
    const result = await prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });
    return { updated: result.count };
  }
  //----------My notifications (list + unread count)---------
  async getMyNotifications(userId: string, query: TListNotificationsQuery) {
    const { page, limit, skip } = getPagination(query.page, query.limit);

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.isRead !== undefined && { isRead: query.isRead }),
    };

    const [items, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: NOTIFICATION_SELECT,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return {
      items,
      unreadCount,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  //----------Unread count only---------
  async getUnreadCount(userId: string) {
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount };
  }

  //----------Mark one as read ---------
  async markOneAsRead(userId: string, notificationId: string) {
    return this.markAsRead({ userId, id: notificationId, isRead: false });
  }

  //----------Mark all as read ---------
  async markAllAsRead(userId: string) {
    return this.markAsRead({ userId, isRead: false });
  }
}

export const notificationService = new NotificationService();
