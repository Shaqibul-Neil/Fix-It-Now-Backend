const notificationTypeEnum = [
  "BOOKING_CREATED", "BOOKING_ACCEPTED", "BOOKING_DECLINED", "BOOKING_PAID",
  "BOOKING_IN_PROGRESS", "BOOKING_COMPLETED", "BOOKING_CANCELLED",
  "PAYMENT_SUCCESS", "PAYMENT_FAILED", "PAYMENT_CANCELLED",
  "REVIEW_SUBMITTED", "REVIEW_PUBLISHED",
  "ACCOUNT_BANNED", "ACCOUNT_REACTIVATED",
  "USER_REGISTERED", "TECHNICIAN_REGISTERED",
  "TECHNICIAN_ONBOARDED", "TECHNICIAN_PROFILE_UPDATED",
  "SERVICE_CREATED", "SERVICE_UPDATED", "SERVICE_DELETED",
  "AVAILABILITY_UPDATED",
];

export const notificationSchemas = {
  Notification: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      type: { type: "string", enum: notificationTypeEnum },
      title: { type: "string" },
      message: { type: "string" },
      data: { type: "object", nullable: true, additionalProperties: true },
      isRead: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
};
