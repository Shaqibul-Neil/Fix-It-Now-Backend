import type { Prisma } from "../../../../generated/prisma/client";

// review returned after create / update
export const REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  status: true,
  createdAt: true,
} as const satisfies Prisma.ReviewSelect;

// review ownership lookup (customer authorization + technician rating)
export const REVIEW_OWNER_SELECT = {
  id: true,
  customerId: true,
  technicianId: true,
} as const satisfies Prisma.ReviewSelect;

// review lookup before moderation
export const REVIEW_MODERATION_SELECT = {
  id: true,
  technicianId: true,
  customer: { select: { userId: true } },
  technician: { select: { userId: true } },
} as const satisfies Prisma.ReviewSelect;

// booking loaded before creating a review
export const REVIEW_BOOKING_SELECT = {
  id: true,
  customerId: true,
  technicianId: true,
  serviceId: true,
  status: true,
  review: {
    select: {
      id: true,
    },
  },
} as const satisfies Prisma.BookingSelect;

// The customer's own reviews. `status` stays: this is where they find out an
// admin has not published their review yet. The technician and the job come
// along because a bare "you gave 5 stars" names nothing the customer can place.
export const REVIEW_LIST_SELECT = {
  ...REVIEW_SELECT,
  bookingId: true,
  technician: {
    select: {
      id: true,
      users: { select: { firstName: true, lastName: true } },
    },
  },
  service: { select: { id: true, title: true } },
} as const satisfies Prisma.ReviewSelect;

// A published review on a technician's public page. No `status` — the query
// forces PUBLISHED, so the field would be the same constant on every row. No
// email either: a review card is not a reason to hand out the reviewer's inbox.
export const PUBLIC_REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  customer: {
    select: {
      id: true,
      users: { select: { firstName: true, lastName: true } },
    },
  },
  service: { select: { id: true, title: true } },
} as const satisfies Prisma.ReviewSelect;

// The admin moderation queue. Both parties with their email, because deciding
// on a disputed review means being able to reach either one, and `updatedAt`
// so an edited review is distinguishable from an untouched one.
export const ADMIN_REVIEW_SELECT = {
  ...REVIEW_LIST_SELECT,
  updatedAt: true,
  technician: {
    select: {
      id: true,
      users: { select: { firstName: true, lastName: true, email: true } },
    },
  },
  customer: {
    select: {
      id: true,
      users: { select: { firstName: true, lastName: true, email: true } },
    },
  },
} as const satisfies Prisma.ReviewSelect;
