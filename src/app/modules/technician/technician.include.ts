import type { Prisma } from "../../../../generated/prisma/client";
import {
  TBookingStatus,
  TReviewStatus,
  TTechnicianApprovalStatus,
  TUserStatus,
} from "../../../../generated/prisma/enums";
import { LIVE_ONLY } from "../../../utils/recordStatus";
import {
  AVAILABILITY_ORDER_BY,
  PUBLIC_AVAILABILITY_SELECT,
} from "../availabilitySlot/availabilitySlot.include";
import { PUBLIC_REVIEW_SELECT } from "../review/review.include";

// The three gates a technician has to pass to exist for a customer: the onboarding form is finished, an admin approved it, and the account is not banned. A ban is an account action and an approval is a review decision, so neither implies the other — every public read spreads all three.
export const PUBLIC_TECHNICIAN_WHERE = {
  isProfileComplete: true,
  approvalStatus: TTechnicianApprovalStatus.APPROVED,
  users: { status: TUserStatus.ACTIVE, deletedAt: null },
} as const satisfies Prisma.TechnicianProfileWhereInput;

export const TECHNICIAN_ROW_SELECT = {
  id: true,
  avatar: true,
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

export const TECHNICIAN_LIST_SELECT = {
  ...TECHNICIAN_ROW_SELECT,
  bio: true,
  professionalTitle: true,
  skills: true,
  isFeatured: true,
  isAvailable: true,
  offersEmergencyService: true,
  services: {
    where: LIVE_ONLY,
    take: 5,
    orderBy: { price: "asc" },
    select: {
      id: true,
      title: true,
      price: true,
      category: { select: { name: true } },
    },
  },
} as const satisfies Prisma.TechnicianProfileSelect;

export const TECHNICIAN_DETAILS_SELECT = {
  id: true,
  bio: true,
  avatar: true,
  coverImage: true,
  professionalTitle: true,
  tagline: true,
  experienceYears: true,
  hourlyRate: true,
  serviceRadius: true,
  city: true,
  area: true,
  averageRating: true,
  totalReviews: true,
  isAvailable: true,
  isFeatured: true,
  offersEmergencyService: true,
  skills: true,
  workHighlights: true,
  approvalStatus: true,
  users: {
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  services: {
    where: LIVE_ONLY,
    select: {
      id: true,
      title: true,
      price: true,
      estimatedDuration: true,
      category: {
        select: {
          name: true,
          image: true,
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
    take: 5,
    select: PUBLIC_REVIEW_SELECT,
  },
  availabilitySlots: {
    where: { isActive: true },
    orderBy: AVAILABILITY_ORDER_BY,
    select: PUBLIC_AVAILABILITY_SELECT,
  },
} as const satisfies Prisma.TechnicianProfileSelect;

// the availability switch on its own — nothing else on the profile moved
export const TECHNICIAN_AVAILABILITY_SELECT = {
  id: true,
  isAvailable: true,
} as const satisfies Prisma.TechnicianProfileSelect;

// the spotlight switch on its own
export const TECHNICIAN_FEATURED_SELECT = {
  id: true,
  isFeatured: true,
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
  ...TECHNICIAN_ROW_SELECT,
  phone: true,
  isFeatured: true,
  approvalStatus: true,
  rejectionReason: true,
  reviewedAt: true,
  createdAt: true,
  users: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      deletedAt: true,
    },
  },
  _count: {
    select: { bookings: { where: { status: TBookingStatus.COMPLETED } } },
  },
} as const satisfies Prisma.TechnicianProfileSelect;

export const ADMIN_TECHNICIAN_DETAILS_SELECT = {
  ...TECHNICIAN_DETAILS_SELECT,
  phone: true,
  address: true,
  nationalId: true,
  nidDocument: true,
  passportNumber: true,
  dateOfBirth: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  isProfileComplete: true,
  approvalStatus: true,
  rejectionReason: true,
  reviewedAt: true,
  reviewedBy: true,
  createdAt: true,
  updatedAt: true,
  users: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      deletedAt: true,
    },
  },
  // No `where`: an admin looking at a technician has to see the paused and the
  // removed services too — those are the rows a complaint is usually about.
  services: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      price: true,
      estimatedDuration: true,
      isActive: true,
      deletedAt: true,
      category: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  },
} as const satisfies Prisma.TechnicianProfileSelect;
