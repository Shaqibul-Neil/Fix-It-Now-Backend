import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import {
  TBookingStatus,
  TPaymentProvider,
  TPaymentStatus,
  TReviewStatus,
  TRole,
  TUserStatus,
} from "../../generated/prisma/enums";
import { buildStatusHistory, type SeededBooking } from "./booking.seed";
import type { SeededCustomer } from "./customer.seed";
import { bookableTechnicians, type SeededTech } from "./technician.seed";
import { LOCATIONS, STREETS } from "./locations";
import {
  DAY,
  HOUR,
  MINUTE,
  daysAgo,
  daysFromNow,
  inBatches,
  makeAvatar,
  makePhone,
  pick,
  randomInt,
} from "./seed.helpers";

// One customer whose dashboard is worth looking at.
//
// The round-robin in booking.seed spreads history thinly — every customer ends
// up with five or six jobs, one per technician, so every technician card reads
// "1 job together" and the maintenance list has nothing to say. That is honest
// for a new marketplace and useless as a demo.
//
// This seed builds the other end of the range: a household that has been on the
// platform for a year and a half, books across most of the catalogue, and comes
// back to the same handful of technicians. It is the row you open when you want
// to see the customer dashboard doing all of its jobs at once.
//
// The dates below are not random. Each recurring category is placed so that the
// maintenance list renders one of every state — due, soon, ok, never — because
// a screenshot with four "on track" rows proves nothing.

const EMAIL = "power.cust@fixitnow.com";
const FIRST_NAME = "Shirin";
const LAST_NAME = "Akter";

// Older than the oldest booking below, or the account would post-date its own
// history.
const JOINED_DAYS_AGO = 560;

// How the finished jobs are spread across the catalogue.
//
// `latestDaysAgo` is the whole point of this table: it is the most recent job in
// that category, and it is what the maintenance countdown reads. Against the
// intervals set in category.seed:
//
//   AC Repair        180-day cycle, last done 200 days ago  → DUE (20 days over)
//   Cleaning          90-day cycle, last done  84 days ago  → SOON (6 days left)
//   Appliance Repair 365-day cycle, last done  95 days ago  → OK (270 days left)
//   Pest Control     180-day cycle, never booked            → NEVER
//
// Pest Control is deliberately missing from this list. A recurring category the
// customer has never touched is the only upsell on the dashboard, and without
// one the "Never booked" branch never renders.
const CATEGORY_PLAN = [
  { categoryName: "AC Repair", count: 8, latestDaysAgo: 200, gapDays: 30 },
  { categoryName: "Cleaning", count: 9, latestDaysAgo: 84, gapDays: 45 },
  { categoryName: "Appliance Repair", count: 5, latestDaysAgo: 95, gapDays: 70 },
  { categoryName: "Plumbing", count: 7, latestDaysAgo: 12, gapDays: 40 },
  { categoryName: "Electrical", count: 6, latestDaysAgo: 26, gapDays: 50 },
  { categoryName: "Carpentry", count: 5, latestDaysAgo: 40, gapDays: 55 },
  { categoryName: "Painting", count: 4, latestDaysAgo: 150, gapDays: 120 },
];

// Every 6th finished job is left unreviewed, so the "Awaiting Your Review" card
// has a number and the technician cards have a "not rated yet" among them.
const UNREVIEWED_EVERY = 6;

// The live bookings, nearest first. The dashboard gives the stepper to whichever
// is scheduled soonest, so the job happening today is the one that gets it and
// the other three fall into the compact list underneath.
const ACTIVE_PLAN: { status: TBookingStatus; inDays: number }[] = [
  { status: TBookingStatus.IN_PROGRESS, inDays: 0 },
  { status: TBookingStatus.ACCEPTED, inDays: 3 },
  { status: TBookingStatus.PAID, inDays: 6 },
  { status: TBookingStatus.REQUESTED, inDays: 11 },
];

// Two of each, so the booking history page has something other than green rows.
const CLOSED_PLAN: { status: TBookingStatus; daysAgo: number }[] = [
  { status: TBookingStatus.CANCELLED, daysAgo: 34 },
  { status: TBookingStatus.CANCELLED, daysAgo: 118 },
  { status: TBookingStatus.DECLINED, daysAgo: 61 },
  { status: TBookingStatus.DECLINED, daysAgo: 203 },
];

const REVIEW_COMMENTS = [
  "Third time I have booked him and the standard has not slipped once. Arrived on time, worked cleanly and talked me through what he had done before leaving.",

  "Quoted before starting, charged what he quoted, and showed me the part he had taken out. That is all I want from a callout.",

  "Quick and tidy. He spotted a second problem while he was here and told me it could wait rather than adding it to the bill.",

  "Booked in the morning, done by the afternoon. He left the room exactly as he found it, which after the last company I used was a relief.",

  "Knows the building by now, which saves twenty minutes of explaining every time. Work was solid and the price was fair.",
];

const PENDING_COMMENT =
  "Good work in the end, but the visit ran nearly two hours past the slot I booked and nobody called to tell me.";

const HIDDEN_COMMENT =
  "Hidden by a moderator: the original text named a neighbour and repeated a complaint that belongs on a different booking.";

// Deterministic ratings — a real history is mostly good with the odd bad day,
// and the moderation states have to be represented or the review pipeline looks
// like it only ever produces PUBLISHED rows.
function makeReview(index: number) {
  if (index % UNREVIEWED_EVERY === UNREVIEWED_EVERY - 1) return undefined;

  if (index % 17 === 4) {
    return {
      rating: 3,
      status: TReviewStatus.PENDING,
      comment: PENDING_COMMENT,
    };
  }

  if (index % 23 === 7) {
    return {
      rating: 2,
      status: TReviewStatus.HIDDEN,
      comment: HIDDEN_COMMENT,
    };
  }

  return {
    rating: index % 4 === 0 ? 4 : 5,
    status: TReviewStatus.PUBLISHED,
    comment: pick(REVIEW_COMMENTS, index % REVIEW_COMMENTS.length),
  };
}

function makePayment(status: TBookingStatus, index: number) {
  const provider =
    index % 9 === 0 ? TPaymentProvider.STRIPE : TPaymentProvider.SSLCOMMERZ;
  const method = index % 2 === 0 ? "bKash" : "VISA-CARD";

  switch (status) {
    case TBookingStatus.COMPLETED:
      // One refund in the whole history — enough to prove the state exists
      // without making the account look like a problem customer.
      return index === 13
        ? { status: TPaymentStatus.REFUNDED, provider, method }
        : { status: TPaymentStatus.SUCCESS, provider, method };
    case TBookingStatus.PAID:
    case TBookingStatus.IN_PROGRESS:
      return { status: TPaymentStatus.SUCCESS, provider, method };
    case TBookingStatus.ACCEPTED:
      // Accepted but not yet paid — this is the one the customer has to act on.
      return { status: TPaymentStatus.PENDING, provider };
    case TBookingStatus.CANCELLED:
      return index % 2 === 0
        ? { status: TPaymentStatus.REFUNDED, provider, method }
        : undefined;
    default:
      return undefined;
  }
}

export async function seedPowerCustomer(
  technicians: SeededTech[],
  passwordHash: string,
): Promise<{ customer: SeededCustomer; bookings: SeededBooking[]; email: string }> {
  const bookable = bookableTechnicians(technicians);

  // Which technicians can actually take a job in each category. Built once so
  // the plan below can cycle through it — cycling is what produces the repeat
  // visits that make the "Your Technicians" card mean something.
  const byCategory = new Map<string, { tech: SeededTech; serviceIndex: number }[]>();
  for (const tech of bookable) {
    tech.services.forEach((service, serviceIndex) => {
      if (service.removedBy !== null) return;
      const pool = byCategory.get(service.categoryName) ?? [];
      pool.push({ tech, serviceIndex });
      byCategory.set(service.categoryName, pool);
    });
  }

  // ---------- the account ----------
  const location = pick(LOCATIONS, 0);

  const user = await prisma.user.create({
    data: {
      firstName: FIRST_NAME,
      lastName: LAST_NAME,
      email: EMAIL,
      passwordHash,
      role: TRole.CUSTOMER,
      status: TUserStatus.ACTIVE,
      lastLoginAt: daysAgo(1),
      createdAt: daysAgo(JOINED_DAYS_AGO),
      customerProfile: {
        create: {
          phone: makePhone("0173", 1),
          avatar: makeAvatar("women", 3),
          city: location.city,
          area: location.area,
          postalCode: location.postalCode,
          defaultAddress: `${pick(STREETS, 2)}, ${location.area}, ${location.city}`,
        },
      },
    },
    include: { customerProfile: true },
  });

  const profile = user.customerProfile;
  if (!profile) {
    throw new Error(`Seed error: customer profile missing for ${EMAIL}`);
  }

  const customer: SeededCustomer = {
    userId: user.id,
    profileId: profile.id,
    fullName: `${FIRST_NAME} ${LAST_NAME}`,
    status: TUserStatus.ACTIVE,
    isRemoved: false,
  };

  // ---------- the history ----------
  const bookings: SeededBooking[] = [];
  let index = 0;

  // Takes the next technician in a category, wrapping when the pool runs out.
  // The wrap is the mechanism: a category with three technicians and eight jobs
  // hands two of them three visits each.
  const takeFromCategory = (categoryName: string, turn: number) => {
    const pool = byCategory.get(categoryName);
    if (!pool || pool.length === 0) {
      throw new Error(
        `Seed error: no bookable technician offers "${categoryName}"`,
      );
    }
    const entry = pick(pool, turn % pool.length);
    return { tech: entry.tech, service: pick(entry.tech.services, entry.serviceIndex) };
  };

  const addBooking = (
    categoryName: string,
    turn: number,
    status: TBookingStatus,
    scheduledAt: Date,
  ) => {
    const { tech, service } = takeFromCategory(categoryName, turn);
    const position = index++;

    const isAcceptedOnward =
      status === TBookingStatus.ACCEPTED ||
      status === TBookingStatus.PAID ||
      status === TBookingStatus.IN_PROGRESS ||
      status === TBookingStatus.COMPLETED;

    const acceptedAt = isAcceptedOnward
      ? new Date(scheduledAt.getTime() - 2 * DAY)
      : null;

    const completedAt =
      status === TBookingStatus.COMPLETED
        ? new Date(scheduledAt.getTime() + randomInt(1, 5) * HOUR)
        : null;

    const cancelledAt =
      status === TBookingStatus.CANCELLED
        ? new Date(scheduledAt.getTime() - 1 * DAY)
        : null;

    const responseMinutes = acceptedAt ? randomInt(5, 90) : null;

    // Derived from the acceptance, not picked separately, so the stored
    // responseMinutes agrees with the two timestamps sitting next to it.
    const createdAt =
      acceptedAt && responseMinutes
        ? new Date(acceptedAt.getTime() - responseMinutes * MINUTE)
        : new Date(scheduledAt.getTime() - randomInt(2, 6) * DAY);

    bookings.push({
      id: randomUUID(),
      customerId: customer.profileId,
      customerUserId: customer.userId,
      technicianId: tech.profileId,
      technicianUserId: tech.userId,
      technicianName: tech.fullName,
      serviceId: service.id,
      categoryId: service.categoryId,
      categoryName: service.categoryName,
      amount: service.price,
      status,
      scheduledAt,
      acceptedAt,
      completedAt,
      cancelledAt,
      responseMinutes,
      createdAt,
      payment: makePayment(status, position),
      review:
        status === TBookingStatus.COMPLETED ? makeReview(position) : undefined,
    });
  };

  // Finished jobs, category by category, walking backwards in time from the
  // anchor date so the newest row in each category is the one the maintenance
  // countdown reads.
  for (const plan of CATEGORY_PLAN) {
    for (let i = 0; i < plan.count; i++) {
      addBooking(
        plan.categoryName,
        i,
        TBookingStatus.COMPLETED,
        daysAgo(plan.latestDaysAgo + i * plan.gapDays, randomInt(9, 17)),
      );
    }
  }

  // Live jobs.
  ACTIVE_PLAN.forEach((plan, i) => {
    const categoryName = pick(
      ["Electrical", "Carpentry", "Cleaning", "Plumbing"],
      i,
    );
    addBooking(
      categoryName,
      i + 2,
      plan.status,
      daysFromNow(plan.inDays, randomInt(9, 17)),
    );
  });

  // Cancelled and declined.
  CLOSED_PLAN.forEach((plan, i) => {
    const categoryName = pick(["Plumbing", "Painting", "AC Repair", "Cleaning"], i);
    addBooking(
      categoryName,
      i + 1,
      plan.status,
      daysAgo(plan.daysAgo, randomInt(9, 17)),
    );
  });

  // ---------- insert ----------
  const bookingRows = bookings.map((booking, i) => ({
    id: booking.id,
    customerId: booking.customerId,
    technicianId: booking.technicianId,
    serviceId: booking.serviceId,
    status: booking.status,
    address: `${pick(STREETS, 2)}, ${location.area}`,
    city: location.city,
    area: location.area,
    notes: i % 5 === 0 ? "Same flat as last time — third floor, lift on the right." : null,
    amount: booking.amount,
    categoryId: booking.categoryId,
    categoryName: booking.categoryName,
    scheduledAt: booking.scheduledAt,
    acceptedAt: booking.acceptedAt,
    completedAt: booking.completedAt,
    cancelledAt: booking.cancelledAt,
    responseMinutes: booking.responseMinutes,
    createdAt: booking.createdAt,
  }));

  await inBatches(bookingRows, 200, (chunk) =>
    prisma.booking.createMany({ data: chunk }),
  );

  const historyRows = bookings.flatMap((booking) =>
    buildStatusHistory(
      booking,
      booking.status === TBookingStatus.CANCELLED
        ? "Rescheduling to next month."
        : booking.status === TBookingStatus.DECLINED
          ? "Fully booked that day."
          : null,
    ),
  );

  await inBatches(historyRows, 500, (chunk) =>
    prisma.bookingStatusHistory.createMany({ data: chunk }),
  );

  return { customer, bookings, email: EMAIL };
}
