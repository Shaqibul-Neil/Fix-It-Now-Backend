import {
  TBookingStatus,
  TMaintenanceType,
} from "../../../../../generated/prisma/enums";
import { prisma } from "../../../../lib/prisma";
import { LIVE_ONLY } from "../../../../utils/recordStatus";
import {
  ACTIVE_BOOKING_STATUSES,
  CUSTOMER_ACTIVE_BOOKING_SELECT,
} from "./customer.stats.include";
import type { IRecurringCategory } from "./customer.stats.interface";

// Category wise completed booking.
export const groupCustomerBookingsByCategory = (userId: string) => {
  return prisma.booking.groupBy({
    by: ["categoryId", "categoryName"],
    where: { customer: { userId }, status: TBookingStatus.COMPLETED },
    _count: { _all: true },
    _max: { completedAt: true },
    // Biggest slice first. Without it Postgres returns the groups in whatever
    // order it built them, so the donut legend reads out of sequence and the
    // order can change between requests.
    orderBy: { _count: { categoryId: "desc" } },
  });
};

// Fetch categories that follow a recurring maintenance cycle (e.g., AC servicing, deep cleaning).
// One-time repair categories like fridge repair will not be included here because their maintenanceType is NONE, so they will never appear in the reminder list.
export const findRecurringCategories = (): Promise<IRecurringCategory[]> => {
  return prisma.category.findMany({
    where: {
      ...LIVE_ONLY,
      maintenanceType: TMaintenanceType.RECURRING,
      maintenanceIntervalDays: { not: null },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      maintenanceIntervalDays: true,
    },
    orderBy: { name: "asc" },
  });
};

// Every technician this customer has worked with, and how many times.
// groupBy would return only the id, forcing a second query for the names.
// Filtering inside _count gets both in one round trip.
export const findCustomerTechnicians = (userId: string) => {
  const completedForCustomer = {
    customer: { userId },
    status: TBookingStatus.COMPLETED,
  } as const;

  return prisma.technicianProfile.findMany({
    where: { bookings: { some: completedForCustomer } },
    orderBy: { id: "asc" },
    select: {
      id: true,
      avatar: true,
      professionalTitle: true,
      users: { select: { firstName: true, lastName: true } },
      _count: { select: { bookings: { where: completedForCustomer } } },
    },
  });
};

// What this customer scored each technician. Not the technician's public
// average — this card is the customer's own experience of them.
export const groupCustomerRatingsByTechnician = (userId: string) => {
  return prisma.review.groupBy({
    by: ["technicianId"],
    where: { customer: { userId } },
    _avg: { rating: true },
  });
};

// Bookings still in flight, soonest first. The ordering is finished here, so
// the service takes index 0 for the stepper instead of sorting again.
export const findCustomerActiveBookings = (userId: string) => {
  return prisma.booking.findMany({
    where: {
      customer: { userId },
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
    },
    select: CUSTOMER_ACTIVE_BOOKING_SELECT,
    orderBy: { scheduledAt: "asc" },
  });
};
