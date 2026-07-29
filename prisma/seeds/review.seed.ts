import { prisma } from "../../src/lib/prisma";
import { TReviewStatus } from "../../generated/prisma/enums";
import type { SeededBooking } from "./booking.seed";
import type { SeededTech } from "./technician.seed";
import { HOUR, inBatches, randomInt } from "./seed.helpers";

export async function seedReviews(
  bookings: SeededBooking[],
  technicians: SeededTech[],
): Promise<number> {
  const rows = bookings
    .filter((b) => b.review !== undefined)
    .map((b) => {
      // Non-null: the filter above already dropped the unreviewed bookings.
      const spec = b.review!;

      // A review is written a few hours to a couple of days after the job ends.
      const writtenAt = new Date(
        (b.completedAt ?? b.scheduledAt).getTime() + randomInt(2, 48) * HOUR,
      );

      return {
        bookingId: b.id,
        customerId: b.customerId,
        technicianId: b.technicianId,
        serviceId: b.serviceId,
        rating: spec.rating,
        comment: spec.comment,
        status: spec.status,
        createdAt: writtenAt,
      };
    });

  await inBatches(rows, 300, (chunk) =>
    prisma.review.createMany({ data: chunk }),
  );

  // Recompute the cached rating from PUBLISHED reviews only — hidden, rejected
  // and not-yet-moderated reviews must not move a technician's public score.
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

  return rows.length;
}
