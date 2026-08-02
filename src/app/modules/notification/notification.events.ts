import { TNotificationType, TRole } from "../../../../generated/prisma/enums";
import { getAdminIds, tryNotifyMany, tryNotifyUser } from "./notification.emit";
import type {
  INotifyPayload,
  INotifyRecipient,
} from "./notification.interface";

//a single payload to every admin
const forAdmins = async (
  payload: INotifyPayload,
): Promise<INotifyRecipient[]> => {
  try {
    const adminIds = await getAdminIds();
    return adminIds.map((id) => ({ userId: id, ...payload }));
  } catch (error) {
    console.error("[notification] getAdminIds failed:", error);
    return [];
  }
};

// ---------- BOOKING NOTIFICATIONS----------
//  Customer creates booking → Technician + Admin
export const notifyBookingCreated = async (
  bookingId: string,
  technicianUserId: string,
  customerName: string,
): Promise<void> => {
  const data = { target: "booking", bookingId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.BOOKING_CREATED,
    title: "New booking request",
    message: `A new booking request from ${customerName}.`,
    data,
  });

  const technicianNotifications = {
    userId: technicianUserId,
    type: TNotificationType.BOOKING_CREATED,
    title: "New booking request",
    message: `You have received a new booking request from ${customerName}.`,
    data,
  };

  //sending notification to admin + technician
  await tryNotifyMany([technicianNotifications, ...adminNotifications]);
};

// Technician accepts → Customer + Admin
export const notifyBookingAccepted = async (
  bookingId: string,
  customerUserId: string,
  technicianName: string,
  amount: string,
): Promise<void> => {
  const data = { target: "booking", bookingId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.BOOKING_ACCEPTED,
    title: "Booking accepted",
    message: `Booking accepted by ${technicianName}.`,
    data,
  });

  const customerNotifications = {
    userId: customerUserId,
    type: TNotificationType.BOOKING_ACCEPTED,
    title: "Booking accepted",
    message: `Your booking has been accepted. Please pay ${amount} taka for further process`,
    data,
  };

  //sending notification to admin + technician
  await tryNotifyMany([customerNotifications, ...adminNotifications]);
};

// Technician declines → Customer + Admin
export const notifyBookingDeclined = async (
  bookingId: string,
  customerUserId: string,
  technicianName: string,
): Promise<void> => {
  const data = { target: "booking", bookingId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.BOOKING_DECLINED,
    title: "Booking declined",
    message: `Booking declined by ${technicianName}.`,
    data,
  });

  const customerNotifications = {
    userId: customerUserId,
    type: TNotificationType.BOOKING_DECLINED,
    title: "Booking declined",
    message: "Your booking request was declined.",
    data,
  };

  //sending notification to admin + customer
  await tryNotifyMany([customerNotifications, ...adminNotifications]);
};

// Customer cancels booking → Technician + Admin
export const notifyBookingCancelled = async (
  bookingId: string,
  technicianUserId: string,
  customerName: string,
): Promise<void> => {
  const data = { target: "booking", bookingId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.BOOKING_CANCELLED,
    title: "Booking cancelled",
    message: `Booking cancelled by ${customerName}.`,
    data,
  });

  const technicianNotifications = {
    userId: technicianUserId,
    type: TNotificationType.BOOKING_CANCELLED,
    title: "Booking cancelled",
    message: `Your upcoming booking was cancelled by ${customerName}.`,
    data,
  };

  //sending notification to admin + technician
  await tryNotifyMany([technicianNotifications, ...adminNotifications]);
};

// Technician marks IN_PROGRESS → Customer + Admin
export const notifyBookingInProgress = async (
  bookingId: string,
  customerUserId: string,
): Promise<void> => {
  const data = { target: "booking", bookingId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.BOOKING_IN_PROGRESS,
    title: "Booking in progress",
    message: "Booking moved to In Progress.",
    data,
  });

  const customerNotifications = {
    userId: customerUserId,
    type: TNotificationType.BOOKING_IN_PROGRESS,
    title: "Service in progress",
    message: "Your service is now in progress.",
    data,
  };

  //sending notification to admin + customer
  await tryNotifyMany([customerNotifications, ...adminNotifications]);
};

// Technician marks COMPLETED → Customer + Admin
export const notifyBookingCompleted = async (
  bookingId: string,
  customerUserId: string,
): Promise<void> => {
  const data = { target: "booking", bookingId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.BOOKING_COMPLETED,
    title: "Booking completed",
    message: "Booking completed.",
    data,
  });

  const customerNotifications = {
    userId: customerUserId,
    type: TNotificationType.BOOKING_COMPLETED,
    title: "Service completed",
    message: "Service completed. Please leave a review.",
    data,
  };

  //sending notification to admin + customer
  await tryNotifyMany([customerNotifications, ...adminNotifications]);
};

// ---------- PAYMENT NOTIFICATIONS----------
// Customer completes payment → Customer + Technician + Admin
export const notifyPaymentSuccess = async (
  bookingId: string,
  amount: string,
  customerName: string,
  customerUserId: string,
  technicianUserId: string,
): Promise<void> => {
  const data = { target: "booking", bookingId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.PAYMENT_SUCCESS,
    title: "Payment received",
    message: `${amount} taka Payment received for booking #${bookingId} from ${customerName}.`,
    data,
  });

  const customerNotifications = {
    userId: customerUserId,
    type: TNotificationType.PAYMENT_SUCCESS,
    title: "Payment successful",
    message: "Your payment was successful.",
    data,
  };

  const technicianNotifications = {
    userId: technicianUserId,
    type: TNotificationType.BOOKING_PAID,
    title: "Payment confirmed",
    message:
      "The customer has completed the payment. You can now start the service.",
    data,
  };

  //sending notification to admin + customer + technician
  await tryNotifyMany([
    customerNotifications,
    technicianNotifications,
    ...adminNotifications,
  ]);
};

// Payment failed / cancelled → Customer + Admin
export const notifyPaymentFailed = async (
  bookingId: string,
  customerUserId: string,
  customerName: string,
): Promise<void> => {
  const data = { target: "booking", bookingId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.PAYMENT_FAILED,
    title: "Payment failed",
    message: `Payment failed for booking #${bookingId} by ${customerName}.`,
    data,
  });

  const customerNotifications = {
    userId: customerUserId,
    type: TNotificationType.PAYMENT_FAILED,
    title: "Payment failed",
    message: "Your payment could not be completed. Please try again.",
    data,
  };

  await tryNotifyMany([customerNotifications, ...adminNotifications]);
};

// ---------- REVIEW NOTIFICATIONS----------
// Customer submits review (PENDING) → Admin
export const notifyReviewSubmitted = async (
  reviewId: string,
): Promise<void> => {
  const data = { target: "review", reviewId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.REVIEW_SUBMITTED,
    title: "Review awaiting approval",
    message: "A new review is awaiting approval.",
    data,
  });

  //sending notification to admin only
  await tryNotifyMany(adminNotifications);
};

// Admin publishes review → Customer + Technician
export const notifyReviewPublished = async (
  reviewId: string,
  customerUserId: string,
  technicianUserId: string,
): Promise<void> => {
  const data = { target: "review", reviewId };

  const customerNotifications = {
    userId: customerUserId,
    type: TNotificationType.REVIEW_PUBLISHED,
    title: "Review published",
    message: "Your review has been published.",
    data,
  };

  const technicianNotifications = {
    userId: technicianUserId,
    type: TNotificationType.REVIEW_PUBLISHED,
    title: "New review",
    message: "You received a new review.",
    data,
  };

  //sending notification to customer + technician
  await tryNotifyMany([customerNotifications, technicianNotifications]);
};

// ---------- ACCOUNT / REGISTRATION NOTIFICATIONS----------
// New user/technician registers → Admin
export const notifyUserRegistered = async (
  registeredUserId: string,
  userName: string,
  role: TRole,
): Promise<void> => {
  const data = { target: "user", userId: registeredUserId };
  const isTechnician = role === TRole.TECHNICIAN;

  const adminNotifications = await forAdmins({
    type: isTechnician
      ? TNotificationType.TECHNICIAN_REGISTERED
      : TNotificationType.USER_REGISTERED,
    title: isTechnician ? "New technician registered" : "New user registered",
    message: `${userName} registered as a ${role.toLowerCase()}.`,
    data,
  });

  //sending notification to admin only
  await tryNotifyMany(adminNotifications);
};

// Technician completes onboarding → Admin
export const notifyTechnicianOnboarded = async (
  technicianUserId: string,
  technicianName: string,
): Promise<void> => {
  const data = { target: "user", userId: technicianUserId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.TECHNICIAN_ONBOARDED,
    title: "Technician onboarding complete",
    message: `${technicianName} has completed onboarding.`,
    data,
  });

  //sending notification to admin only
  await tryNotifyMany(adminNotifications);
};

// Technician updates profile → Admin
export const notifyTechnicianProfileUpdated = async (
  technicianUserId: string,
  technicianName: string,
): Promise<void> => {
  const data = { target: "user", userId: technicianUserId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.TECHNICIAN_PROFILE_UPDATED,
    title: "Technician profile updated",
    message: `${technicianName} updated their profile.`,
    data,
  });

  await tryNotifyMany(adminNotifications);
};

// Admin approves the onboarding → Technician
export const notifyTechnicianApproved = async (
  technicianUserId: string,
): Promise<void> => {
  await tryNotifyUser(technicianUserId, {
    type: TNotificationType.TECHNICIAN_APPROVED,
    title: "Profile approved",
    message:
      "Your profile has been approved. You can now publish services and take bookings.",
    data: { target: "user", userId: technicianUserId },
  });
};

// Admin rejects the onboarding → Technician
export const notifyTechnicianRejected = async (
  technicianUserId: string,
  reason: string,
): Promise<void> => {
  await tryNotifyUser(technicianUserId, {
    type: TNotificationType.TECHNICIAN_REJECTED,
    title: "Profile rejected",
    message: `Your profile was rejected. Reason: ${reason}`,
    data: { target: "user", userId: technicianUserId },
  });
};

// ---------- AVAILABILITY NOTIFICATIONS----------
// Technician updates availability → Admin
export const notifyAvailabilityUpdated = async (
  technicianUserId: string,
  technicianName: string,
): Promise<void> => {
  const data = { target: "user", userId: technicianUserId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.AVAILABILITY_UPDATED,
    title: "Availability updated",
    message: `${technicianName} updated their availability.`,
    data,
  });

  //sending notification to admin only
  await tryNotifyMany(adminNotifications);
};

// ---------- SERVICE NOTIFICATIONS----------
// Technician creates a service → Admin
export const notifyServiceCreated = async (
  serviceId: string,
  serviceTitle: string,
  technicianName: string,
): Promise<void> => {
  const data = { target: "service", serviceId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.SERVICE_CREATED,
    title: "New service created",
    message: `"${serviceTitle}" created by ${technicianName}.`,
    data,
  });

  //sending notification to admin only
  await tryNotifyMany(adminNotifications);
};

// Technician updates a service → Admin
export const notifyServiceUpdated = async (
  serviceId: string,
  serviceTitle: string,
  technicianName: string,
): Promise<void> => {
  const data = { target: "service", serviceId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.SERVICE_UPDATED,
    title: "Service updated",
    message: `"${serviceTitle}" updated by ${technicianName}.`,
    data,
  });

  //sending notification to admin only
  await tryNotifyMany(adminNotifications);
};

// Technician/Admin deletes a service → owner Technician + Admin
export const notifyServiceDeleted = async (
  serviceTitle: string,
  technicianUserId: string,
  technicianName: string,
  removedByAdmin: boolean,
): Promise<void> => {
  const data = { target: "service" };

  const adminNotifications = await forAdmins({
    type: TNotificationType.SERVICE_DELETED,
    title: "Service deleted",
    message: removedByAdmin
      ? `"${serviceTitle}" was removed by an admin.`
      : `"${serviceTitle}" was removed by ${technicianName}.`,
    data,
  });

  const recipients = [...adminNotifications];

  if (removedByAdmin) {
    recipients.push({
      userId: technicianUserId,
      type: TNotificationType.SERVICE_DELETED,
      title: "Service removed",
      message: `Your service "${serviceTitle}" was removed by an admin.`,
      data,
    });
  }

  await tryNotifyMany(recipients);
};

// Admin restores a removed service → owner Technician + Admin
export const notifyServiceRestored = async (
  serviceId: string,
  serviceTitle: string,
  technicianUserId: string,
  restoredByAdmin: boolean,
): Promise<void> => {
  const data = { target: "service", serviceId };

  const adminNotifications = await forAdmins({
    type: TNotificationType.SERVICE_RESTORED,
    title: "Service restored",
    message: `"${serviceTitle}" was restored.`,
    data,
  });

  const recipients = [...adminNotifications];
  if (restoredByAdmin) {
    recipients.push({
      userId: technicianUserId,
      type: TNotificationType.SERVICE_RESTORED,
      title: "Service restored",
      message: `Your service "${serviceTitle}" is live again.`,
      data,
    });
  }

  await tryNotifyMany(recipients);
};

// ---------- CATEGORY NOTIFICATIONS ----------
export const notifyCategoryDeactivated = async (
  categoryName: string,
  affectedTechnicianUserIds: string[],
): Promise<void> => {
  const data = { target: "category" };
  const adminNotifications = await forAdmins({
    type: TNotificationType.CATEGORY_DEACTIVATED,
    title: "Category unavailable",
    message: `"${categoryName}" is no longer available. ${affectedTechnicianUserIds.length} technician(s) affected.`,
    data,
  });
  const technicianNotifications = affectedTechnicianUserIds.map((userId) => ({
    userId,
    type: TNotificationType.CATEGORY_DEACTIVATED,
    title: "Category unavailable",
    message: `The "${categoryName}" category is no longer available, so your services under it are hidden from customers.`,
    data,
  }));
  await tryNotifyMany([...technicianNotifications, ...adminNotifications]);
};

// The same category comes back → the same technicians + Admin
export const notifyCategoryReactivated = async (
  categoryName: string,
  affectedTechnicianUserIds: string[],
): Promise<void> => {
  const data = { target: "category" };
  const adminNotifications = await forAdmins({
    type: TNotificationType.CATEGORY_REACTIVATED,
    title: "Category available again",
    message: `"${categoryName}" is available again.`,
    data,
  });
  const technicianNotifications = affectedTechnicianUserIds.map((userId) => ({
    userId,
    type: TNotificationType.CATEGORY_REACTIVATED,
    title: "Category available again",
    message: `The "${categoryName}" category is available again — your services under it are visible to customers.`,
    data,
  }));

  await tryNotifyMany([...technicianNotifications, ...adminNotifications]);
};

// ---------- ACCOUNT MODERATION NOTIFICATIONS ----------
// An admin turned an account off or back on. A locked-out user cannot read  anything, so a ban or a removal is recorded for the admins only — it is an audit trail, not a message. Coming back is the opposite: that one the user  reads the moment they log in.
export const notifyAccountAccessChanged = async (
  targetUserId: string,
  targetUserName: string,
  isRegainingAccess: boolean,
): Promise<void> => {
  const data = { target: "user", userId: targetUserId };
  const type = isRegainingAccess
    ? TNotificationType.ACCOUNT_REACTIVATED
    : TNotificationType.ACCOUNT_BANNED;

  const adminNotifications = await forAdmins({
    type,
    title: isRegainingAccess ? "Account reactivated" : "Account suspended",
    message: isRegainingAccess
      ? `${targetUserName} can sign in again.`
      : `${targetUserName} can no longer sign in.`,
    data,
  });

  const recipients = [...adminNotifications];

  if (isRegainingAccess) {
    recipients.push({
      userId: targetUserId,
      type,
      title: "Welcome back",
      message: "Your account has been reactivated. You can sign in as usual.",
      data,
    });
  }

  await tryNotifyMany(recipients);
};
