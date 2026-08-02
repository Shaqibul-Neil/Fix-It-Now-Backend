import type { Prisma } from "../../../../generated/prisma/client";
import { createFullName, toParagraphs } from "../../../utils/utils";
import type {
  ADMIN_REVIEW_SELECT,
  PUBLIC_REVIEW_SELECT,
  REVIEW_LIST_SELECT,
} from "./review.include";

// customer's own review — who it was for and which job it was about
export const reviewListMapper = (
  review: Prisma.ReviewGetPayload<{ select: typeof REVIEW_LIST_SELECT }>,
) => ({
  id: review.id,
  rating: review.rating,
  comment: review.comment,
  status: review.status,
  createdAt: review.createdAt,
  bookingId: review.bookingId,
  technician: {
    id: review.technician.id,
    name: createFullName(
      review.technician.users.firstName,
      review.technician.users.lastName,
    ),
    avatar: review.technician.avatar,
  },
  service: {
    id: review.service.id,
    title: review.service.title,
  },
});

// public review card — the technician is already the page, so only the reviewer
// and the job they hired for are attached
export const publicReviewMapper = (
  review: Prisma.ReviewGetPayload<{ select: typeof PUBLIC_REVIEW_SELECT }>,
) => ({
  id: review.id,
  rating: review.rating,
  comment: toParagraphs(review.comment),
  createdAt: review.createdAt,
  customer: {
    id: review.customer.id,
    name: createFullName(
      review.customer.users.firstName,
      review.customer.users.lastName,
    ),
    avatar: review.customer.avatar,
  },
  service: {
    id: review.service.id,
    title: review.service.title,
  },
});

// admin moderation row — the customer's row plus who is being reviewed and how
// to reach either party
export const adminReviewMapper = (
  review: Prisma.ReviewGetPayload<{ select: typeof ADMIN_REVIEW_SELECT }>,
) => ({
  ...reviewListMapper(review),
  updatedAt: review.updatedAt,
  technician: {
    id: review.technician.id,
    name: createFullName(
      review.technician.users.firstName,
      review.technician.users.lastName,
    ),
    avatar: review.technician.avatar,
    email: review.technician.users.email,
  },
  customer: {
    id: review.customer.id,
    name: createFullName(
      review.customer.users.firstName,
      review.customer.users.lastName,
    ),
    email: review.customer.users.email,
    avatar: review.customer.avatar,
  },
});
