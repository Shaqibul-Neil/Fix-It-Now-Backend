import { prisma } from "../../src/lib/prisma";
import {
  TBookingStatus,
  TNotificationType,
  TPaymentStatus,
  TTechnicianApprovalStatus,
} from "../../generated/prisma/enums";
import type { Prisma } from "../../generated/prisma/client";
import type { SeededBooking } from "./booking.seed";
import type { SeededTech } from "./technician.seed";
import type { SeededAdmins } from "./admin.seed";
import { HOUR, chance, inBatches, randomInt } from "./seed.helpers";

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
  admins: SeededAdmins,
): Promise<number> {
  const rows: NotificationRow[] = [];

  // ---------- onboarding + approval trail ----------
  for (const tech of technicians) {
    const data = { target: "technician", technicianId: tech.profileId };
    const appliedAt = new Date(Date.now() - randomInt(20, 170) * 24 * HOUR);

    // Every submitted onboarding pings every admin.
    for (const adminId of admins.ids) {
      rows.push(
        row(
          adminId,
          TNotificationType.TECHNICIAN_ONBOARDED,
          "Technician onboarding complete",
          `${tech.fullName} has completed their onboarding.`,
          data,
          appliedAt,
        ),
      );
    }

    if (tech.approvalStatus === TTechnicianApprovalStatus.APPROVED) {
      rows.push(
        row(
          tech.userId,
          TNotificationType.TECHNICIAN_APPROVED,
          "Profile approved",
          "Your profile has been approved. You can now add services and receive bookings.",
          data,
          new Date(appliedAt.getTime() + randomInt(12, 120) * HOUR),
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
          new Date(appliedAt.getTime() + randomInt(12, 120) * HOUR),
        ),
      );
    }
  }

  // ---------- booking + payment trail ----------
  // Only the newest slice gets notifications; replaying all 250 bookings would
  // bury the inbox in rows nobody will ever scroll to.
  const recent = [...bookings]
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
    .slice(0, 80);

  for (const b of recent) {
    const data = { target: "booking", bookingId: b.id };
    const requestedAt = new Date(b.scheduledAt.getTime() - 3 * 24 * HOUR);

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

    // 3. payment outcome
    if (b.payment?.status === TPaymentStatus.SUCCESS) {
      rows.push(
        row(
          b.technicianUserId,
          TNotificationType.PAYMENT_SUCCESS,
          "Payment received",
          `Payment of ${b.amount} taka has been received for your booking.`,
          data,
          new Date((b.acceptedAt ?? requestedAt).getTime() + 8 * HOUR),
        ),
      );
    }
    if (b.payment?.status === TPaymentStatus.FAILED) {
      rows.push(
        row(
          b.customerUserId,
          TNotificationType.PAYMENT_FAILED,
          "Payment failed",
          "Your payment could not be processed. Please try again.",
          data,
          new Date((b.acceptedAt ?? requestedAt).getTime() + 8 * HOUR),
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
          "Your booking has been completed. Leave a review to help others.",
          data,
          b.completedAt,
        ),
      );

      // 5. review moderation trail
      if (b.review) {
        rows.push(
          row(
            b.technicianUserId,
            TNotificationType.REVIEW_SUBMITTED,
            "New review",
            "A customer left a review on your completed booking.",
            { target: "review", bookingId: b.id },
            new Date(b.completedAt.getTime() + 6 * HOUR),
          ),
        );
      }
    }
  }

  await inBatches(rows, 500, (chunk) =>
    prisma.notification.createMany({ data: chunk }),
  );

  return rows.length;
}
