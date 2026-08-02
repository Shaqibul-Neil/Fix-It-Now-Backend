import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import {
  TBookingStatus,
  TPaymentProvider,
  TPaymentStatus,
  TReviewStatus,
  TUserStatus,
} from "../../generated/prisma/enums";
import { bookableTechnicians, type SeededTech } from "./technician.seed";
import type { SeededCustomer } from "./customer.seed";
import { STREETS } from "./locations";
import {
  DAY,
  HOUR,
  chance,
  daysFromNow,
  inBatches,
  pick,
  pickRandom,
  randomInt,
  randomPastDate,
} from "./seed.helpers";

export interface PaymentSpec {
  status: TPaymentStatus;
  provider: TPaymentProvider;
  method?: string;
}

export interface ReviewSpec {
  rating: number;
  status: TReviewStatus;
  comment: string;
}

// A created booking enriched with the payment/review intent for downstream seeders.
export interface SeededBooking {
  id: string;
  customerId: string; // customer PROFILE id
  customerUserId: string;
  technicianId: string; // technician PROFILE id
  technicianUserId: string;
  technicianName: string;
  serviceId: string;
  categoryName: string;
  amount: number;
  status: TBookingStatus;
  scheduledAt: Date;
  acceptedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  payment?: PaymentSpec;
  review?: ReviewSpec;
}

// ---------- how the history is shaped ----------
// Every approved technician gets at least MIN_PER_TECH bookings, so the
// technician dashboard is never empty for any of them.
const MIN_PER_TECH = 10;
const MAX_PER_TECH = 14;

const S = TBookingStatus;

// The fixed spine every technician gets, then extra COMPLETED rows on top.
const BASE_PLAN: TBookingStatus[] = [
  S.COMPLETED,
  S.COMPLETED,
  S.COMPLETED,
  S.COMPLETED,
  S.COMPLETED,
  S.PAID,
  S.IN_PROGRESS,
  S.ACCEPTED,
  S.REQUESTED,
  S.DECLINED,
];

const DECLINE_NOTES = [
  "Fully booked that day.",
  "Outside my service area.",
  "Job needs a specialist tool I do not carry.",
  "Requested slot clashes with an existing job.",
];

const CANCEL_NOTES = [
  "Plan changed.",
  "Found the issue was smaller than expected.",
  "Rescheduling to next month.",
  "Cancelled after payment — refund requested.",
];

const BOOKING_NOTES = [
  "Please call before arriving.",
  "Second floor, lift available.",
  "Gate code is 1102.",
  "Urgent — leaking since morning.",
  null,
  null,
];

// Review text is stored the same way a bio is: one Text column, a blank line
// between paragraphs, split on the way out. Every comment runs past twenty words
// so a review card on the technician profile has something real to show, and two
// of the published ones are deliberately multi-paragraph.
const PUBLISHED_COMMENTS = [
  "Arrived ten minutes early, laid down a sheet before starting and left the bathroom cleaner than he found it. The leak has not come back once in three weeks.",

  "Booked in the morning and the job was finished by the afternoon. He explained the fault clearly instead of just quoting a number at me.\n\nThe price matched the estimate exactly. I would book him again without thinking about it.",

  "Fair price for the amount of work involved, and he showed me the worn part he replaced rather than just telling me about it. No complaints at all.",

  "Knew what the problem was within five minutes of walking in. Fixed it in one visit with no second appointment and no extra charge for the part.",

  "Polite, punctual and clearly experienced. Covered the furniture before starting and took all the packaging away with him at the end.\n\nSecond time I have booked him now, and I will keep doing so.",

  "Solid work overall. He started about half an hour late because of traffic, but he called ahead to say so and stayed on until the job was properly done.",
];

const PENDING_COMMENTS = [
  "The work itself was fine and the finish looks neat, but the job ran about two hours past what was quoted and nobody warned me it would.",

  "Decent job for the price. He had to come back the next morning for a part, which was not ideal, but he did not charge anything extra for it.",
];

const HIDDEN_COMMENTS = [
  "Hidden by a moderator: the customer included a personal phone number and a home address in the original text, so the review is not shown on the profile.",

  "Hidden while a billing complaint attached to this booking is being looked at. The rating stays out of the public average until that is settled.",
];

const REJECTED_COMMENTS = [
  "Rejected by moderation: the original comment contained abusive language aimed at the technician and does not describe the work that was actually carried out.",

  "Rejected as spam: the text was an advert for an unrelated business and had nothing to do with the booking it was attached to.",
];

const CARD_METHODS = ["VISA-CARD", "MASTERCARD", "AMEX"];
const MFS_METHODS = ["bKash", "Nagad", "Rocket", "Upay"];

// ---------- helpers ----------

function buildPlan(): TBookingStatus[] {
  const extra = randomInt(MIN_PER_TECH, MAX_PER_TECH) - BASE_PLAN.length;
  const plan = [...BASE_PLAN];
  for (let i = 0; i < extra; i++) {
    // The tail is weighted towards COMPLETED so revenue and reviews grow.
    plan.push(i === 0 ? S.CANCELLED : S.COMPLETED);
  }
  return plan;
}

function makePaymentSpec(status: TBookingStatus): PaymentSpec | undefined {
  const provider = chance(12)
    ? TPaymentProvider.STRIPE
    : TPaymentProvider.SSLCOMMERZ;
  const method = chance(50) ? pickRandom(CARD_METHODS) : pickRandom(MFS_METHODS);

  switch (status) {
    case S.COMPLETED:
      return chance(10)
        ? { status: TPaymentStatus.REFUNDED, provider, method }
        : { status: TPaymentStatus.SUCCESS, provider, method };
    case S.PAID:
    case S.IN_PROGRESS:
      return { status: TPaymentStatus.SUCCESS, provider, method };
    case S.ACCEPTED:
      // Accepted but not settled — half are still pending, half failed at the gateway.
      return chance(50)
        ? { status: TPaymentStatus.PENDING, provider }
        : { status: TPaymentStatus.FAILED, provider };
    case S.CANCELLED:
      // Only the ones cancelled AFTER paying carry a refunded payment row.
      return chance(40)
        ? { status: TPaymentStatus.REFUNDED, provider, method }
        : undefined;
    default:
      return undefined; // REQUESTED and DECLINED never reach the gateway
  }
}

function makeReviewSpec(status: TBookingStatus): ReviewSpec | undefined {
  // Only a finished job can be reviewed, and ~30% are left unreviewed so
  // POST /reviews is testable against seeded data.
  if (status !== S.COMPLETED || chance(30)) return undefined;

  const roll = randomInt(1, 100);
  if (roll <= 70) {
    return {
      rating: randomInt(4, 5),
      status: TReviewStatus.PUBLISHED,
      comment: pickRandom(PUBLISHED_COMMENTS),
    };
  }
  if (roll <= 82) {
    return {
      rating: randomInt(3, 4),
      status: TReviewStatus.PENDING,
      comment: pickRandom(PENDING_COMMENTS),
    };
  }
  if (roll <= 91) {
    return {
      rating: randomInt(2, 3),
      status: TReviewStatus.HIDDEN,
      comment: pickRandom(HIDDEN_COMMENTS),
    };
  }
  return {
    rating: randomInt(1, 2),
    status: TReviewStatus.REJECTED,
    comment: pickRandom(REJECTED_COMMENTS),
  };
}

// Where the booking sits on the calendar, driven by its final status.
function scheduleFor(status: TBookingStatus): Date {
  switch (status) {
    case S.COMPLETED:
    case S.DECLINED:
    case S.CANCELLED:
      return randomPastDate(2, 88); // the 3-month history
    case S.PAID:
    case S.IN_PROGRESS:
      return daysFromNow(randomInt(-1, 1), randomInt(9, 17)); // happening now
    default:
      return daysFromNow(randomInt(1, 14), randomInt(9, 17)); // REQUESTED / ACCEPTED
  }
}

// The status trail a real booking would have left behind, with increasing
// timestamps so GET /bookings/:id/history reads in order.
function buildStatusHistory(
  booking: SeededBooking,
  note: string | null,
): {
  bookingId: string;
  status: TBookingStatus;
  changedById: string;
  note: string | null;
  createdAt: Date;
}[] {
  const trail: { status: TBookingStatus; by: string; note: string | null }[] = [
    { status: S.REQUESTED, by: booking.customerUserId, note: null },
  ];

  switch (booking.status) {
    case S.REQUESTED:
      break;
    case S.DECLINED:
      trail.push({ status: S.DECLINED, by: booking.technicianUserId, note });
      break;
    case S.CANCELLED:
      trail.push({ status: S.CANCELLED, by: booking.customerUserId, note });
      break;
    case S.ACCEPTED:
      trail.push({ status: S.ACCEPTED, by: booking.technicianUserId, note: null });
      break;
    case S.PAID:
      trail.push({ status: S.ACCEPTED, by: booking.technicianUserId, note: null });
      trail.push({ status: S.PAID, by: booking.customerUserId, note: null });
      break;
    case S.IN_PROGRESS:
      trail.push({ status: S.ACCEPTED, by: booking.technicianUserId, note: null });
      trail.push({ status: S.PAID, by: booking.customerUserId, note: null });
      trail.push({ status: S.IN_PROGRESS, by: booking.technicianUserId, note: null });
      break;
    case S.COMPLETED:
      trail.push({ status: S.ACCEPTED, by: booking.technicianUserId, note: null });
      trail.push({ status: S.PAID, by: booking.customerUserId, note: null });
      trail.push({ status: S.IN_PROGRESS, by: booking.technicianUserId, note: null });
      trail.push({ status: S.COMPLETED, by: booking.technicianUserId, note: null });
      break;
  }

  // Spread the trail backwards from the scheduled date so it never lands in the future.
  const start = booking.scheduledAt.getTime() - 3 * DAY;
  const step = (3 * DAY) / Math.max(1, trail.length);

  return trail.map((entry, index) => ({
    bookingId: booking.id,
    status: entry.status,
    changedById: entry.by,
    note: entry.note,
    createdAt: new Date(start + index * step),
  }));
}

// ---------- main ----------
export async function seedBookings(
  technicians: SeededTech[],
  customers: SeededCustomer[],
): Promise<SeededBooking[]> {
  const bookable = bookableTechnicians(technicians);
  if (bookable.length === 0) {
    throw new Error("Seed error: no bookable technician to attach bookings to");
  }

  // New bookings only ever come from customers who can still sign in. The
  // banned and the removed ones keep their old history, which is what the admin
  // user detail page shows — deleting the account never deletes the record of
  // what it did.
  const activeCustomers = customers.filter(
    (c) => c.status === TUserStatus.ACTIVE && !c.isRemoved,
  );
  const lockedOutCustomers = customers.filter(
    (c) => c.status === TUserStatus.BANNED || c.isRemoved,
  );

  const bookings: SeededBooking[] = [];
  let customerCursor = 0;

  for (const tech of bookable) {
    for (const status of buildPlan()) {
      // Round-robin the active customers so every one of the 40 has history,
      // with the odd old booking assigned to an account that has since been
      // banned or removed.
      const isHistoric = status === S.COMPLETED || status === S.CANCELLED;
      const customer =
        isHistoric && lockedOutCustomers.length > 0 && chance(6)
          ? pickRandom(lockedOutCustomers)
          : pick(activeCustomers, customerCursor++ % activeCustomers.length);

      const service = pickRandom(tech.services);
      const scheduledAt = scheduleFor(status);

      const acceptedAt =
        status === S.ACCEPTED ||
        status === S.PAID ||
        status === S.IN_PROGRESS ||
        status === S.COMPLETED
          ? new Date(scheduledAt.getTime() - 2 * DAY)
          : null;

      const completedAt =
        status === S.COMPLETED
          ? new Date(scheduledAt.getTime() + randomInt(1, 5) * HOUR)
          : null;

      const cancelledAt =
        status === S.CANCELLED
          ? new Date(scheduledAt.getTime() - 1 * DAY)
          : null;

      bookings.push({
        id: randomUUID(),
        customerId: customer.profileId,
        customerUserId: customer.userId,
        technicianId: tech.profileId,
        technicianUserId: tech.userId,
        technicianName: tech.fullName,
        serviceId: service.id,
        categoryName: service.categoryName,
        amount: service.price,
        status,
        scheduledAt,
        acceptedAt,
        completedAt,
        cancelledAt,
        payment: makePaymentSpec(status),
        review: makeReviewSpec(status),
      });
    }
  }

  // ---------- insert ----------
  const bookingRows = bookings.map((b, index) => {
    const tech = bookable.find((t) => t.profileId === b.technicianId);
    return {
      id: b.id,
      customerId: b.customerId,
      technicianId: b.technicianId,
      serviceId: b.serviceId,
      status: b.status,
      address: pick(STREETS, index % STREETS.length),
      city: tech?.city ?? "Dhaka",
      area: tech?.area ?? "Gulshan",
      notes: pick(BOOKING_NOTES, index % BOOKING_NOTES.length),
      amount: b.amount,
      categoryName: b.categoryName,
      scheduledAt: b.scheduledAt,
      acceptedAt: b.acceptedAt,
      completedAt: b.completedAt,
      cancelledAt: b.cancelledAt,
      // A booking is created a few days before it is scheduled.
      createdAt: new Date(b.scheduledAt.getTime() - randomInt(2, 6) * DAY),
    };
  });

  await inBatches(bookingRows, 200, (chunk) =>
    prisma.booking.createMany({ data: chunk }),
  );

  const historyRows = bookings.flatMap((b, index) => {
    const note =
      b.status === S.DECLINED
        ? pick(DECLINE_NOTES, index % DECLINE_NOTES.length)
        : b.status === S.CANCELLED
          ? pick(CANCEL_NOTES, index % CANCEL_NOTES.length)
          : null;
    return buildStatusHistory(b, note);
  });

  await inBatches(historyRows, 500, (chunk) =>
    prisma.bookingStatusHistory.createMany({ data: chunk }),
  );

  return bookings;
}
