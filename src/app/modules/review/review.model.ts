import {
  TReviewStatus,
  type Prisma,
} from "../../../../generated/prisma/client";

export const computeTechnicianRating = async (
  tx: Prisma.TransactionClient,
  technicianId: string,
) => {
  const aggregate = await tx.review.aggregate({
    where: {
      technicianId,
      status: TReviewStatus.PUBLISHED,
    },
    _avg: { rating: true },
    _count: { rating: true },
  });
  // Update technician profile
  await tx.technicianProfile.update({
    where: { id: technicianId },
    data: {
      averageRating: aggregate._avg.rating ?? 0,
      totalReviews: aggregate._count.rating,
    },
  });
};
