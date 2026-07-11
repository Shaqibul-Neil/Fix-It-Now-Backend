import { validateRequest } from "../../../middlewares/validate";
import { protectedRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { notificationController } from "./notification.controller";
import {
  listNotificationsSchema,
  notificationIdParamSchema,
} from "./notification.validation";

export const notificationRoute: TRouteModule = {
  basePath: "",
  routes: [
    {
      method: "get",
      path: "/notifications",
      middlewares: protectedRoute(validateRequest(listNotificationsSchema)),
      handler: notificationController.getMyNotifications,
    },
    {
      method: "get",
      path: "/notifications/unread-count",
      middlewares: protectedRoute(),
      handler: notificationController.getUnreadCount,
    },
    {
      method: "patch",
      path: "/notifications/read-all",
      middlewares: protectedRoute(),
      handler: notificationController.markAllAsRead,
    },
    {
      method: "patch",
      path: "/notifications/:id/read",
      middlewares: protectedRoute(validateRequest(notificationIdParamSchema)),
      handler: notificationController.markOneAsRead,
    },
  ],
};
