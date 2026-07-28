import type { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";

//Total revenue
export const totalRevenue = async (
  where: Prisma.PaymentWhereInput,
): Promise<number> => {
  const result = await prisma.payment.aggregate({
    where,
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
};

//Total booking
export const totalBooking = async (
  where: Prisma.BookingWhereInput,
): Promise<number> => {
  const result = await prisma.booking.count({ where });
  return result;
};

//Total user based on role
export const totalUsers = async (
  where: Prisma.UserWhereInput,
): Promise<number> => {
  const result = await prisma.user.count({ where });
  return result;
};

//Total booking for repeated customer
export const groupBookingsByCustomer = async (
  where: Prisma.BookingWhereInput,
) => {
  return prisma.booking.groupBy({ by: ["customerId"], where, _count: true });
};

//group booking by category
export const groupBookingByCategory = async (
  where: Prisma.BookingWhereInput,
) => {
  return prisma.booking.groupBy({
    by: ["categoryName"],
    where,
    _count: true,
  });
};

//get all category names
export const getAllCategoryNames = async (): Promise<string[]> => {
  const result = await prisma.category.findMany({ select: { name: true } });
  return result.map((r) => r.name);
};

//get all payments
export const getPaymentsInRange = async (where: Prisma.PaymentWhereInput) => {
  return prisma.payment.findMany({
    where,
    select: { paidAt: true, amount: true },
    orderBy: { paidAt: "asc" },
  });
};

//get last 5 booking based on where
export const getLastFiveBookings = async <S extends Prisma.BookingSelect>({
  where,
  select,
  orderBy,
}: {
  where: Prisma.BookingWhereInput;
  select: S;
  orderBy: Prisma.BookingOrderByWithRelationInput;
}): Promise<Prisma.BookingGetPayload<{ select: S }>[]> => {
  const result = await prisma.booking.findMany({
    where,
    orderBy,
    take: 5,
    select,
  });

  return result as Prisma.BookingGetPayload<{ select: S }>[];
};

// Sum of booking amounts for a given filter.
export const sumBookingAmount = async (
  where: Prisma.BookingWhereInput,
): Promise<number> => {
  const result = await prisma.booking.aggregate({
    where,
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
};

// Technician current average rating
export const getTechnicianAverageRating = async (
  technicianId: string,
): Promise<number> => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { id: technicianId },
    select: { averageRating: true },
  });
  return Number(profile?.averageRating ?? 0);
};

// Completed bookings in a range
export const getCompletedBookingsInRange = async (
  where: Prisma.BookingWhereInput,
) => {
  return prisma.booking.findMany({
    where,
    select: { completedAt: true, amount: true },
    orderBy: { completedAt: "asc" },
  });
};
