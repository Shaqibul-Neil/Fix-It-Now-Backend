import { prisma } from "../../src/lib/prisma";
import {
  TBookingStatus,
  TPaymentProvider,
  TPaymentStatus,
  TReviewStatus,
} from "../../generated/prisma/enums";
import type { SeededTech } from "./technician.seed";
import type { SeededCustomer } from "./customer.seed";

export interface PaymentSpec {
  status: TPaymentStatus;
  provider: TPaymentProvider;
  method?: string;
}
export interface ReviewSpec {
  rating: number;
  status: TReviewStatus;
  comment?: string;
}

// A created booking enriched with the payment/review intent for downstream seeders.
export interface SeededBooking {
  id: string;
  customerId: string; // customer PROFILE id
  technicianId: string; // technician PROFILE id
  serviceId: string;
  amount: number;
  scheduledAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  payment?: PaymentSpec;
  review?: ReviewSpec;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Safe indexed access (tsconfig has noUncheckedIndexedAccess: true)
function pick<T>(arr: T[], i: number): T {
  const item = arr[i];
  if (item === undefined) {
    throw new Error(`Seed error: index ${i} out of range`);
  }
  return item;
}

// Build the status-history trail for a booking based on its final status.
function buildStatusHistory(
  status: TBookingStatus,
  customerUserId: string,
  technicianUserId: string,
  note?: string,
): { status: TBookingStatus; changedById: string; note?: string }[] {
  const history: {
    status: TBookingStatus;
    changedById: string;
    note?: string;
  }[] = [{ status: TBookingStatus.REQUESTED, changedById: customerUserId }];

  switch (status) {
    case TBookingStatus.REQUESTED:
      break;
    case TBookingStatus.DECLINED:
      history.push({
        status: TBookingStatus.DECLINED,
        changedById: technicianUserId,
        note,
      });
      break;
    case TBookingStatus.CANCELLED:
      history.push({
        status: TBookingStatus.CANCELLED,
        changedById: customerUserId,
        note: note ?? "Cancelled by customer",
      });
      break;
    case TBookingStatus.ACCEPTED:
      history.push({
        status: TBookingStatus.ACCEPTED,
        changedById: technicianUserId,
      });
      break;
    case TBookingStatus.PAID:
      history.push({
        status: TBookingStatus.ACCEPTED,
        changedById: technicianUserId,
      });
      history.push({
        status: TBookingStatus.PAID,
        changedById: customerUserId,
      });
      break;
    case TBookingStatus.IN_PROGRESS:
      history.push({
        status: TBookingStatus.ACCEPTED,
        changedById: technicianUserId,
      });
      history.push({
        status: TBookingStatus.PAID,
        changedById: customerUserId,
      });
      history.push({
        status: TBookingStatus.IN_PROGRESS,
        changedById: technicianUserId,
      });
      break;
    case TBookingStatus.COMPLETED:
      history.push({
        status: TBookingStatus.ACCEPTED,
        changedById: technicianUserId,
      });
      history.push({
        status: TBookingStatus.PAID,
        changedById: customerUserId,
      });
      history.push({
        status: TBookingStatus.IN_PROGRESS,
        changedById: technicianUserId,
      });
      history.push({
        status: TBookingStatus.COMPLETED,
        changedById: technicianUserId,
      });
      break;
  }
  return history;
}

interface BookingConfig {
  cust: number;
  tech: number;
  svcIdx?: number;
  status: TBookingStatus;
  notes?: string; // booking.notes
  note?: string; // status-history note
  payment?: PaymentSpec;
  review?: ReviewSpec;
}

export async function seedBookings(
  technicians: SeededTech[],
  customers: SeededCustomer[],
): Promise<SeededBooking[]> {
  const S = TBookingStatus;
  const P = TPaymentStatus;
  const PV = TPaymentProvider;
  const RV = TReviewStatus;

  const bookingConfigs: BookingConfig[] = [
    // COMPLETED x8 (each with a payment + a review) — hosts all 4 review statuses
    { cust: 0, tech: 0, status: S.COMPLETED, payment: { status: P.SUCCESS, provider: PV.SSLCOMMERZ, method: "VISA-CARD" }, review: { rating: 5, status: RV.PUBLISHED, comment: "Excellent, fixed the leak fast." } },
    { cust: 1, tech: 1, status: S.COMPLETED, payment: { status: P.SUCCESS, provider: PV.SSLCOMMERZ, method: "MASTERCARD" }, review: { rating: 4, status: RV.PUBLISHED, comment: "Fan installed neatly." } },
    { cust: 2, tech: 2, status: S.COMPLETED, payment: { status: P.SUCCESS, provider: PV.SSLCOMMERZ, method: "bKash" }, review: { rating: 3, status: RV.PENDING, comment: "Decent cleaning, awaiting moderation." } },
    { cust: 3, tech: 3, status: S.COMPLETED, payment: { status: P.SUCCESS, provider: PV.SSLCOMMERZ, method: "VISA-CARD" }, review: { rating: 4, status: RV.PENDING, comment: "Good paint job." } },
    { cust: 4, tech: 4, status: S.COMPLETED, payment: { status: P.SUCCESS, provider: PV.SSLCOMMERZ, method: "Nagad" }, review: { rating: 2, status: RV.HIDDEN, comment: "Hidden by admin - off-topic." } },
    { cust: 0, tech: 1, status: S.COMPLETED, payment: { status: P.SUCCESS, provider: PV.SSLCOMMERZ, method: "MASTERCARD" }, review: { rating: 3, status: RV.HIDDEN, comment: "Hidden pending re-check." } },
    { cust: 1, tech: 2, status: S.COMPLETED, payment: { status: P.REFUNDED, provider: PV.SSLCOMMERZ, method: "bKash" }, review: { rating: 1, status: RV.REJECTED, comment: "Rejected - abusive language." } },
    { cust: 2, tech: 3, status: S.COMPLETED, payment: { status: P.REFUNDED, provider: PV.SSLCOMMERZ, method: "VISA-CARD" }, review: { rating: 2, status: RV.REJECTED, comment: "Rejected - spam." } },

    // COMPLETED but NOT reviewed yet — so POST /reviews is testable on seed data
    { cust: 3, tech: 0, status: S.COMPLETED, payment: { status: P.SUCCESS, provider: PV.SSLCOMMERZ, method: "VISA-CARD" } },
    { cust: 4, tech: 1, status: S.COMPLETED, payment: { status: P.SUCCESS, provider: PV.SSLCOMMERZ, method: "Nagad" } },

    // REQUESTED x2 (no payment yet)
    { cust: 3, tech: 4, status: S.REQUESTED },
    { cust: 4, tech: 0, status: S.REQUESTED },

    // ACCEPTED x4 (payment PENDING x2 + FAILED x2)
    { cust: 0, tech: 2, status: S.ACCEPTED, payment: { status: P.PENDING, provider: PV.SSLCOMMERZ } },
    { cust: 1, tech: 3, status: S.ACCEPTED, payment: { status: P.FAILED, provider: PV.SSLCOMMERZ } },
    { cust: 2, tech: 4, status: S.ACCEPTED, payment: { status: P.PENDING, provider: PV.SSLCOMMERZ } },
    { cust: 3, tech: 0, status: S.ACCEPTED, payment: { status: P.FAILED, provider: PV.SSLCOMMERZ } },

    // DECLINED x2
    { cust: 4, tech: 1, status: S.DECLINED, note: "Fully booked that day." },
    { cust: 0, tech: 3, status: S.DECLINED, note: "Outside service area." },

    // PAID x2 (payment SUCCESS)
    { cust: 1, tech: 4, status: S.PAID, payment: { status: P.SUCCESS, provider: PV.SSLCOMMERZ, method: "MASTERCARD" } },
    { cust: 2, tech: 0, status: S.PAID, payment: { status: P.SUCCESS, provider: PV.SSLCOMMERZ, method: "bKash" } },

    // IN_PROGRESS x2 (payment SUCCESS)
    { cust: 3, tech: 1, status: S.IN_PROGRESS, payment: { status: P.SUCCESS, provider: PV.SSLCOMMERZ, method: "Rocket" } },
    { cust: 4, tech: 2, status: S.IN_PROGRESS, payment: { status: P.SUCCESS, provider: PV.SSLCOMMERZ, method: "VISA-CARD" } },

    // CANCELLED x2 (one plain, one refunded)
    { cust: 0, tech: 4, status: S.CANCELLED, note: "Plan changed." },
    { cust: 1, tech: 0, status: S.CANCELLED, note: "Cancelled after payment.", payment: { status: P.REFUNDED, provider: PV.SSLCOMMERZ, method: "MASTERCARD" } },
  ];

  const ACCEPTED_LIKE: TBookingStatus[] = [
    S.ACCEPTED,
    S.PAID,
    S.IN_PROGRESS,
    S.COMPLETED,
  ];
  const PAST_LIKE: TBookingStatus[] = [S.COMPLETED, S.DECLINED, S.CANCELLED];

  const now = new Date();
  const result: SeededBooking[] = [];
  let i = 0;

  for (const cfg of bookingConfigs) {
    const customer = pick(customers, cfg.cust);
    const tech = pick(technicians, cfg.tech);
    const service = pick(tech.services, cfg.svcIdx ?? 0);

    const isPast = PAST_LIKE.includes(cfg.status);
    const scheduledAt = new Date(
      now.getTime() + (isPast ? -7 : 3) * DAY + i * 3 * HOUR,
    );

    const timestamps: {
      acceptedAt?: Date;
      completedAt?: Date;
      cancelledAt?: Date;
    } = {};
    if (ACCEPTED_LIKE.includes(cfg.status)) {
      timestamps.acceptedAt = new Date(scheduledAt.getTime() - 2 * DAY);
    }
    if (cfg.status === S.COMPLETED) {
      timestamps.completedAt = new Date(scheduledAt.getTime() + 3 * HOUR);
    }
    if (cfg.status === S.CANCELLED) {
      timestamps.cancelledAt = new Date(scheduledAt.getTime() - 1 * DAY);
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.profileId,
        technicianId: tech.profileId,
        serviceId: service.id,
        amount: service.price,
        status: cfg.status,
        address: "House 12, Road 3",
        city: "Dhaka",
        area: "Gulshan",
        notes: cfg.notes,
        scheduledAt,
        ...timestamps,
        statusHistory: {
          create: buildStatusHistory(
            cfg.status,
            customer.userId,
            tech.userId,
            cfg.note,
          ),
        },
      },
    });

    result.push({
      id: booking.id,
      customerId: customer.profileId,
      technicianId: tech.profileId,
      serviceId: service.id,
      amount: service.price,
      scheduledAt,
      acceptedAt: timestamps.acceptedAt,
      completedAt: timestamps.completedAt,
      payment: cfg.payment,
      review: cfg.review,
    });

    i++;
  }

  return result;
}
