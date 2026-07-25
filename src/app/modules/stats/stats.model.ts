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
