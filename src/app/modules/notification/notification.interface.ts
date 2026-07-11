import type { Prisma } from "../../../../generated/prisma/client";
import type { TNotificationType } from "../../../../generated/prisma/enums";

export interface INotifyPayload {
  type: TNotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
}

export interface INotifyRecipient extends INotifyPayload {
  userId: string;
}
