import {
  TBookingStatus,
  type Prisma,
} from "../../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";

//Group booking by Status
export const groupBookingByStatus = async (where: Prisma.BookingWhereInput) => {
  return prisma.booking.groupBy({
    by: ["status"],
    where,
    _count: true,
  });
};

// zero-filled: every status present (count = 0 when none)
export const getBookingStatusBreakdown = async (
  where: Prisma.BookingWhereInput,
): Promise<{ status: TBookingStatus; count: number }[]> => {
  const rows = await groupBookingByStatus(where);
  const counts = new Map(rows.map((row) => [row.status, row._count]));
  return Object.values(TBookingStatus).map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
};
