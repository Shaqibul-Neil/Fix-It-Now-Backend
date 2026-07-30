import type { Prisma } from "../../../../generated/prisma/client";
import {
  TBookingStatus,
  TReviewStatus,
  TTechnicianApprovalStatus,
  TUserStatus,
} from "../../../../generated/prisma/enums";
import {
  AVAILABILITY_ORDER_BY,
  PUBLIC_AVAILABILITY_SELECT,
} from "../availabilitySlot/availabilitySlot.include";

// The three gates a technician has to pass to exist for a customer: the
// onboarding form is finished, an admin approved it, and the account is not
// banned. A ban is an account action and an approval is a review decision, so
// neither implies the other — every public read spreads all three.
export const PUBLIC_TECHNICIAN_WHERE = {
  isProfileComplete: true,
  approvalStatus: TTechnicianApprovalStatus.APPROVED,
  users: { status: TUserStatus.ACTIVE },
} as const satisfies Prisma.TechnicianProfileWhereInput;

export const TECHNICIAN_LIST_SELECT = {
  id: true,
  experienceYears: true,
  hourlyRate: true,
  city: true,
  area: true,
  averageRating: true,
  totalReviews: true,
  users: {
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  },
} as const satisfies Prisma.TechnicianProfileSelect;

export const TECHNICIAN_DETAILS_SELECT = {
  id: true,
  bio: true,
  experienceYears: true,
  hourlyRate: true,
  serviceRadius: true,
  city: true,
  area: true,
  averageRating: true,
  totalReviews: true,
  approvalStatus: true,
  rejectionReason: true,
  users: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
  services: {
    where: {
      isActive: true,
    },
    select: {
      id: true,
      title: true,
      price: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  },
  reviews: {
    where: {
      status: TReviewStatus.PUBLISHED,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  },
  // The profile page is where a customer decides whether this technician suits
  // them, and "when do they work" is part of that. It rides along here so the
  // page does not need a second request just to answer it.
  availabilitySlots: {
    where: { isActive: true },
    orderBy: AVAILABILITY_ORDER_BY,
    select: PUBLIC_AVAILABILITY_SELECT,
  },
} as const satisfies Prisma.TechnicianProfileSelect;

// profile + owner name — for create/update responses
export const TECHNICIAN_PROFILE_WITH_USER_INCLUDE = {
  users: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
} as const satisfies Prisma.TechnicianProfileInclude;

// technician's own profile view
export const TECHNICIAN_MY_PROFILE_INCLUDE = {
  users: {
    select: {
      firstName: true,
      lastName: true,
      lastLoginAt: true,
      email: true,
    },
  },
} as const satisfies Prisma.TechnicianProfileInclude;

// admin table: summary + completed-jobs count
export const ADMIN_TECHNICIAN_LIST_SELECT = {
  ...TECHNICIAN_LIST_SELECT,
  phone: true,
  approvalStatus: true,
  rejectionReason: true,
  reviewedAt: true,
  createdAt: true,
  _count: {
    select: { bookings: { where: { status: TBookingStatus.COMPLETED } } },
  },
} as const satisfies Prisma.TechnicianProfileSelect;
