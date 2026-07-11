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
