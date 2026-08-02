import { prisma } from "../../src/lib/prisma";
import {
  TBookingStatus,
  TNotificationType,
  TPaymentStatus,
  TReviewStatus,
  TTechnicianApprovalStatus,
  TUserStatus,
} from "../../generated/prisma/enums";
import type { Prisma } from "../../generated/prisma/client";
import type { SeededBooking } from "./booking.seed";
import type { SeededTech } from "./technician.seed";
import type { SeededCustomer } from "./customer.seed";
import type { SeededCategories } from "./category.seed";
import type { SeededAdmins } from "./admin.seed";
import { DAY, HOUR, chance, inBatches, randomInt } from "./seed.helpers";

// The app writes notifications as a side effect of real actions. Nothing replays
// those actions during a seed, so this file recreates the rows the same events
// would have produced — otherwise GET /notifications is empty on a fresh DB.
// Titles and `data` shapes mirror notification.events.ts exactly.

type NotificationRow = {
  userId: string;
  type: TNotificationType;
  title: string;
  message: string;
  data: Prisma.InputJsonValue;
  isRead: boolean;
  createdAt: Date;
};

// Anything older than a fortnight is assumed already read.
function readState(createdAt: Date): boolean {
  const ageDays = (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000);
  if (ageDays > 14) return true;
  return chance(45);
}

function row(
  userId: string,
  type: TNotificationType,
  title: string,
  message: string,
  data: Prisma.InputJsonValue,
  createdAt: Date,
): NotificationRow {
  return { userId, type, title, message, data, isRead: readState(createdAt), createdAt };
}

export async function seedNotifications(
  bookings: SeededBooking[],
  technicians: SeededTech[],
  customers: SeededCustomer[],
  categories: SeededCategories,
  admins: SeededAdmins,
): Promise<number> {
  const rows: NotificationRow[] = [];

  // Every admin-facing event fans out to all of them, so this wrapper is what
  // the `forAdmins` helper in notification.events.ts does.
  const toAdmins = (
    type: TNotificationType,
    title: string,
    message: string,
    data: Prisma.InputJsonValue,
    createdAt: Date,
  ): void => {
    for (const adminId of admins.ids) {
      rows.push(row(adminId, type, title, message, data, createdAt));
    }
  };

  const ago = (days: number): Date => new Date(Date.now() - days * DAY);

  // ---------- registration ----------
  // Only the newest handful, otherwise the admin inbox is 90 identical lines
  // before anything interesting appears.
  for (const tech of technicians.slice(0, 8)) {
    toAdmins(
      TNotificationType.TECHNICIAN_REGISTERED,
      "New technician registered",
      `${tech.fullName} registered as a technician.`,
      { target: "user", userId: tech.userId },
      ago(randomInt(30, 90)),
    );
  }

  for (const customer of customers.slice(0, 8)) {
    toAdmins(
      TNotificationType.USER_REGISTERED,
      "New user registered",
      `${customer.fullName} registered as a customer.`,
      { target: "user", userId: customer.userId },
      ago(randomInt(30, 90)),
    );
  }

  // ---------- onboarding + approval trail ----------
  for (const tech of technicians) {
    const data = { target: "user", userId: tech.userId };
    const appliedAt = ago(randomInt(20, 170));

    // Every submitted onboarding pings every admin.
    toAdmins(
      TNotificationType.TECHNICIAN_ONBOARDED,
      "Technician onboarding complete",
      `${tech.fullName} has completed onboarding.`,
      data,
      appliedAt,
    );

    const reviewedAt = new Date(appliedAt.getTime() + randomInt(12, 120) * HOUR);

    if (tech.approvalStatus === TTechnicianApprovalStatus.APPROVED) {
      rows.push(
        row(
          tech.userId,
          TNotificationType.TECHNICIAN_APPROVED,
          "Profile approved",
          "Your profile has been approved. You can now publish services and take bookings.",
          data,
          reviewedAt,
        ),
      );
    }

    if (tech.approvalStatus === TTechnicianApprovalStatus.REJECTED) {
      rows.push(
        row(
          tech.userId,
          TNotificationType.TECHNICIAN_REJECTED,
          "Profile rejected",
          "Your profile was rejected. Update your profile to send it for review again.",
          data,
          reviewedAt,
        ),
      );
    }
  }

  // ---------- profile edits + availability toggles ----------
  const activeTechnicians = technicians.filter(
    (t) =>
      t.approvalStatus === TTechnicianApprovalStatus.APPROVED &&
      t.userStatus === TUserStatus.ACTIVE &&
      !t.isRemoved,
  );

  for (const tech of activeTechnicians.slice(0, 10)) {
    const data = { target: "user", userId: tech.userId };
    toAdmins(
      TNotificationType.TECHNICIAN_PROFILE_UPDATED,
      "Technician profile updated",
      `${tech.fullName} updated their profile.`,
      data,
      ago(randomInt(1, 25)),
    );
    toAdmins(
      TNotificationType.AVAILABILITY_UPDATED,
      "Availability updated",
      `${tech.fullName} updated their availability.`,
      data,
      ago(randomInt(1, 25)),
    );
  }

  // ---------- service lifecycle ----------
  // A create line for a slice of the catalogue, then the removals — every
  // removed row in the DB has the announcement that put it there.
  for (const tech of activeTechnicians.slice(0, 10)) {
    for (const service of tech.services) {
      const data = { target: "service", serviceId: service.id };

      if (service.removedBy === null) {
        toAdmins(
          TNotificationType.SERVICE_CREATED,
          "New service created",
          `"${service.title}" created by ${tech.fullName}.`,
          data,
          ago(randomInt(20, 80)),
        );
        continue;
      }

      const removedByAdmin = service.removedBy === "admin";
      const removedAt = ago(randomInt(2, 30));

      toAdmins(
        TNotificationType.SERVICE_DELETED,
        "Service deleted",
        removedByAdmin
          ? `"${service.title}" was removed by an admin.`
          : `"${service.title}" was removed by ${tech.fullName}.`,
        { target: "service" },
        removedAt,
      );

      // A technician who removed their own service already knows. Only an
      // admin's removal is news worth pushing at them.
      if (removedByAdmin) {
        rows.push(
          row(
            tech.userId,
            TNotificationType.SERVICE_DELETED,
            "Service removed",
            `Your service "${service.title}" was removed by an admin.`,
            { target: "service" },
            removedAt,
          ),
        );
      }
    }
  }

  // A couple of services that went out and came back, so the restore type is
  // not an empty branch on the notification screen.
  for (const tech of activeTechnicians.slice(0, 3)) {
    const service = tech.services.find((s) => s.removedBy === null);
    if (!service) continue;
    const data = { target: "service", serviceId: service.id };
    const restoredAt = ago(randomInt(1, 10));

    toAdmins(
      TNotificationType.SERVICE_UPDATED,
      "Service updated",
      `"${service.title}" updated by ${tech.fullName}.`,
      data,
      ago(randomInt(1, 20)),
    );
    toAdmins(
      TNotificationType.SERVICE_RESTORED,
      "Service restored",
      `"${service.title}" was restored.`,
      data,
      restoredAt,
    );
    rows.push(
      row(
        tech.userId,
        TNotificationType.SERVICE_RESTORED,
        "Service restored",
        `Your service "${service.title}" is live again.`,
        data,
        restoredAt,
      ),
    );
  }

  // ---------- category moderation ----------
  for (const category of categories.nonLive) {
    toAdmins(
      TNotificationType.CATEGORY_DEACTIVATED,
      "Category unavailable",
      `"${category.name}" is no longer available. 0 technician(s) affected.`,
      { target: "category" },
      ago(randomInt(5, 60)),
    );
  }

  // One that was turned off and put back, so both halves of the pair exist.
  const firstLiveCategory = categories.all[0];
  if (firstLiveCategory) {
    toAdmins(
      TNotificationType.CATEGORY_REACTIVATED,
      "Category available again",
      `"${firstLiveCategory.name}" is available again.`,
      { target: "category" },
      ago(randomInt(2, 15)),
    );
  }

  // ---------- account moderation ----------
  // A banned or removed account cannot read anything, so the suspension is
  // recorded for the admins only — it is an audit trail, not a message.
  const lockedOut = [
    ...technicians
      .filter((t) => t.userStatus === TUserStatus.BANNED || t.isRemoved)
      .map((t) => ({ userId: t.userId, fullName: t.fullName })),
    ...customers
      .filter((c) => c.status === TUserStatus.BANNED || c.isRemoved)
      .map((c) => ({ userId: c.userId, fullName: c.fullName })),
  ];

  for (const account of lockedOut) {
    toAdmins(
      TNotificationType.ACCOUNT_BANNED,
      "Account suspended",
      `${account.fullName} can no longer sign in.`,
      { target: "user", userId: account.userId },
      ago(randomInt(2, 40)),
    );
  }

  // Two accounts that were suspended and then let back in — the only account
  // event the user themselves ever receives.
  const reinstated = customers
    .filter((c) => c.status === TUserStatus.ACTIVE && !c.isRemoved)
    .slice(0, 2);

  for (const account of reinstated) {
    const data = { target: "user", userId: account.userId };
    const reinstatedAt = ago(randomInt(1, 12));

    toAdmins(
      TNotificationType.ACCOUNT_REACTIVATED,
      "Account reactivated",
      `${account.fullName} can sign in again.`,
      data,
      reinstatedAt,
    );
    rows.push(
      row(
        account.userId,
        TNotificationType.ACCOUNT_REACTIVATED,
        "Welcome back",
        "Your account has been reactivated. You can sign in as usual.",
        data,
        reinstatedAt,
      ),
    );
  }

  // ---------- booking + payment trail ----------
  // Only a slice gets notifications; replaying all 250 bookings would bury the
  // inbox in rows nobody will ever scroll to. These stay one-sided on purpose —
  // the admin copy of every booking step is what would bury it.
  //
  // The slice is taken in two halves. A finished job always sits in the past and
  // an open one always sits in the future, so a single sort by date returns
  // nothing but the live pipeline — and the completed, declined and reviewed
  // notification types would end up with no rows at all.
  const isFinished = (b: SeededBooking): boolean =>
    b.status === TBookingStatus.COMPLETED ||
    b.status === TBookingStatus.CANCELLED ||
    b.status === TBookingStatus.DECLINED;

  const newestFirst = (a: SeededBooking, b: SeededBooking): number =>
    b.scheduledAt.getTime() - a.scheduledAt.getTime();

  const recent = [
    ...bookings.filter((b) => !isFinished(b)).sort(newestFirst).slice(0, 50),
    ...bookings.filter(isFinished).sort(newestFirst).slice(0, 50),
  ];

  for (const b of recent) {
    const data = { target: "booking", bookingId: b.id };
    const requestedAt = new Date(b.scheduledAt.getTime() - 3 * DAY);

    // 1. request lands on the technician
    rows.push(
      row(
        b.technicianUserId,
        TNotificationType.BOOKING_CREATED,
        "New booking request",
        "You have received a new booking request.",
        data,
        requestedAt,
      ),
    );

    if (b.status === TBookingStatus.REQUESTED) continue;

    if (b.status === TBookingStatus.DECLINED) {
      rows.push(
        row(
          b.customerUserId,
          TNotificationType.BOOKING_DECLINED,
          "Booking declined",
          "Your booking request was declined.",
          data,
          new Date(requestedAt.getTime() + 6 * HOUR),
        ),
      );
      continue;
    }

    if (b.status === TBookingStatus.CANCELLED) {
      rows.push(
        row(
          b.technicianUserId,
          TNotificationType.BOOKING_CANCELLED,
          "Booking cancelled",
          "Your upcoming booking was cancelled by the customer.",
          data,
          b.cancelledAt ?? new Date(requestedAt.getTime() + 12 * HOUR),
        ),
      );
      continue;
    }

    // 2. accepted → customer is asked to pay
    rows.push(
      row(
        b.customerUserId,
        TNotificationType.BOOKING_ACCEPTED,
        "Booking accepted",
        `Your booking has been accepted. Please pay ${b.amount} taka for further process`,
        data,
        b.acceptedAt ?? new Date(requestedAt.getTime() + 5 * HOUR),
      ),
    );

    // 3. payment outcome — the customer sees PAYMENT_SUCCESS, the technician
    // sees BOOKING_PAID, exactly the way notifyPaymentSuccess splits them.
    const settledAt = new Date((b.acceptedAt ?? requestedAt).getTime() + 8 * HOUR);

    if (b.payment?.status === TPaymentStatus.SUCCESS) {
      rows.push(
        row(
          b.customerUserId,
          TNotificationType.PAYMENT_SUCCESS,
          "Payment successful",
          "Your payment was successful.",
          data,
          settledAt,
        ),
      );
      rows.push(
        row(
          b.technicianUserId,
          TNotificationType.BOOKING_PAID,
          "Payment confirmed",
          "The customer has completed the payment. You can now start the service.",
          data,
          settledAt,
        ),
      );
    }

    if (b.payment?.status === TPaymentStatus.FAILED) {
      rows.push(
        row(
          b.customerUserId,
          TNotificationType.PAYMENT_FAILED,
          "Payment failed",
          "Your payment could not be completed. Please try again.",
          data,
          settledAt,
        ),
      );
    }

    if (b.payment?.status === TPaymentStatus.REFUNDED) {
      rows.push(
        row(
          b.customerUserId,
          TNotificationType.PAYMENT_CANCELLED,
          "Payment refunded",
          "Your payment for this booking has been refunded.",
          data,
          settledAt,
        ),
      );
    }

    // 4. work started / finished
    if (
      b.status === TBookingStatus.IN_PROGRESS ||
      b.status === TBookingStatus.COMPLETED
    ) {
      rows.push(
        row(
          b.customerUserId,
          TNotificationType.BOOKING_IN_PROGRESS,
          "Service in progress",
          `${b.technicianName} has started working on your booking.`,
          data,
          new Date(b.scheduledAt.getTime() + 1 * HOUR),
        ),
      );
    }

    if (b.status === TBookingStatus.COMPLETED && b.completedAt) {
      rows.push(
        row(
          b.customerUserId,
          TNotificationType.BOOKING_COMPLETED,
          "Service completed",
          "Service completed. Please leave a review.",
          data,
          b.completedAt,
        ),
      );

      // 5. review moderation trail
      if (b.review) {
        const submittedAt = new Date(b.completedAt.getTime() + 6 * HOUR);

        toAdmins(
          TNotificationType.REVIEW_SUBMITTED,
          "Review awaiting approval",
          "A new review is awaiting approval.",
          { target: "review", bookingId: b.id },
          submittedAt,
        );

        // Only a published review reaches the two people it is about.
        if (b.review.status === TReviewStatus.PUBLISHED) {
          const publishedAt = new Date(submittedAt.getTime() + 12 * HOUR);
          rows.push(
            row(
              b.customerUserId,
              TNotificationType.REVIEW_PUBLISHED,
              "Review published",
              "Your review has been published.",
              { target: "review", bookingId: b.id },
              publishedAt,
            ),
          );
          rows.push(
            row(
              b.technicianUserId,
              TNotificationType.REVIEW_PUBLISHED,
              "New review",
              "You received a new review.",
              { target: "review", bookingId: b.id },
              publishedAt,
            ),
          );
        }
      }
    }
  }

  await inBatches(rows, 500, (chunk) =>
    prisma.notification.createMany({ data: chunk }),
  );

  return rows.length;
}
