import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import {
  notificationService,
  type NotificationService,
} from "./notification.service";
import type { TListNotificationsQuery } from "./notification.validation";

class NotificationController {
  constructor(private notificationService: NotificationService) {}

  //----------My notifications (list + unread count)---------
  getMyNotifications = asyncHandler(async (req: TRequest, res: TResponse) => {
    const userId = req.user.id as string;
    const query = req.query as TListNotificationsQuery;
    const { items, unreadCount, meta } =
      await this.notificationService.getMyNotifications(userId, query);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Notifications fetched successfully",
      data: { items, unreadCount },
      meta,
    });
  });

  //----------Unread count---------
  getUnreadCount = asyncHandler(async (req: TRequest, res: TResponse) => {
    const userId = req.user.id as string;
    const result = await this.notificationService.getUnreadCount(userId);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Unread count fetched successfully",
      data: result,
    });
  });

  //----------Mark one as read---------
  markOneAsRead = asyncHandler(async (req: TRequest, res: TResponse) => {
    const userId = req.user.id as string;
    const notificationId = req.params.id as string;
    const result = await this.notificationService.markOneAsRead(
      userId,
      notificationId,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Notification marked as read",
      data: result,
    });
  });

  //----------Mark all as read---------
  markAllAsRead = asyncHandler(async (req: TRequest, res: TResponse) => {
    const userId = req.user.id as string;
    const result = await this.notificationService.markAllAsRead(userId);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  });
}

export const notificationController = new NotificationController(
  notificationService,
);
