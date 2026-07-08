import { prisma } from "../../src/lib/prisma";
import { TReviewStatus } from "../../generated/prisma/enums";
import type { SeededBooking } from "./booking.seed";
import type { SeededTech } from "./technician.seed";

export async function seedReviews(
  bookings: SeededBooking[],
  technicians: SeededTech[],
): Promise<number> {
  let count = 0;

  for (const b of bookings) {
    if (!b.review) continue;
    count++;

    await prisma.review.create({
      data: {
        bookingId: b.id,
        customerId: b.customerId,
        technicianId: b.technicianId,
        serviceId: b.serviceId,
        rating: b.review.rating,
        comment: b.review.comment,
        status: b.review.status,
      },
    });
  }

  // Recompute technician rating from PUBLISHED reviews only.
  for (const tech of technicians) {
    const agg = await prisma.review.aggregate({
      where: { technicianId: tech.profileId, status: TReviewStatus.PUBLISHED },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.technicianProfile.update({
      where: { id: tech.profileId },
      data: {
        averageRating: agg._avg.rating ?? 0,
        totalReviews: agg._count,
      },
    });
  }

  return count;
}
