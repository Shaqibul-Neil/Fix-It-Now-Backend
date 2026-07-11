import { TRole, TUserStatus } from "../../../../generated/prisma/enums";
import { prisma } from "../../../lib/prisma";
import type {
  INotifyPayload,
  INotifyRecipient,
} from "./notification.interface";

//Notification for a single recipient.
export const tryNotifyUser = async (
  userId: string,
  payload: INotifyPayload,
): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        ...payload,
      },
    });
  } catch (error) {
    console.error("[notification] notifyUser failed:", error);
  }
};

//many recipients (bulk insert)
export const tryNotifyMany = async (
  notifications: INotifyRecipient[],
): Promise<void> => {
  if (notifications.length === 0) return;
  try {
    await prisma.notification.createMany({ data: notifications });
  } catch (error) {
    console.error("[notification] tryNotifyMany failed:", error);
  }
};

// Get Admin id -- recipients for every notification
export const getAdminIds = async (): Promise<string[]> => {
  const admins = await prisma.user.findMany({
    where: { role: TRole.ADMIN, status: TUserStatus.ACTIVE },
    select: { id: true },
  });
  return admins.map((admin) => admin.id);
};
