import { prisma } from "../../src/lib/prisma";
import { TReviewStatus } from "../../generated/prisma/enums";
import type { SeededBooking } from "./booking.seed";
import type { SeededTech } from "./technician.seed";
import { HOUR, inBatches, randomInt } from "./seed.helpers";

// When the row was last written. Prisma stamps @updatedAt with now() unless it
// is passed explicitly, which would make every seeded review read "edited
// today" — and on the admin screen a gap from createdAt is exactly the signal
// that the customer went back and changed their review.
function lastWriteAt(status: TReviewStatus, writtenAt: Date): Date {
  switch (status) {
    case TReviewStatus.PENDING:
      // Nobody has touched it yet — that is what PENDING means.
      return writtenAt;
    default:
      // A moderator got to it within a few hours to a couple of days.
      return new Date(writtenAt.getTime() + randomInt(1, 48) * HOUR);
  }
}

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
        // Copied off the booking, not looked up off the service: the review
        // belongs to the category the job was actually done under, even if the
        // service has been moved somewhere else since.
        categoryId: b.categoryId,
        rating: spec.rating,
        comment: spec.comment,
        status: spec.status,
        createdAt: writtenAt,
        updatedAt: lastWriteAt(spec.status, writtenAt),
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
