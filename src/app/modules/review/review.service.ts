import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import { findCustomerProfileByUserId } from "../customer/customer.utils";
import type {
  TCreateReviewPayload,
  TListReviewQuery,
  TPublicReviewQuery,
  TUpdateReviewPayload,
} from "./review.validation";
import {
  TBookingStatus,
  TReviewStatus,
  TRole,
} from "../../../../generated/prisma/enums";
import { ensureNotEmptyObject, getPagination } from "../../../utils/utils";
import { REVIEW_SELECT } from "./review.include";
import { buildReviewFilter, computeTechnicianRating } from "./review.utils";
import type { Prisma } from "../../../../generated/prisma/client";

export class ReviewService {
  // Shared review list query
  private async reviewLists(
    baseWhere: Prisma.ReviewWhereInput,
    query: TListReviewQuery,
  ) {
    const { page, limit, skip } = getPagination(query.page, query.limit);

    const where = buildReviewFilter(baseWhere, query);

    const [items, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: REVIEW_SELECT,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total },
    };
  }
  //-------------CUSTOMER ACTIONS----------
  //--------------Create Review-------------
  async createReview(userId: string, payload: TCreateReviewPayload) {
    //get the customer
    const customer = await findCustomerProfileByUserId(userId);
    //get the booking and check
    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
      select: {
        id: true,
        customerId: true,
        technicianId: true,
        serviceId: true,
        status: true,
        review: { select: { id: true } },
      },
    });
    if (!booking) {
      throw new AppError("Booking not found.", httpStatus.NOT_FOUND);
    }
    if (booking.customerId !== customer.id) {
      throw new AppError(
        "You can only review your own bookings.",
        httpStatus.FORBIDDEN,
      );
    }
    if (booking.status !== TBookingStatus.COMPLETED) {
      throw new AppError(
        "You can only review completed bookings.",
        httpStatus.BAD_REQUEST,
      );
    }
    if (booking.review) {
      throw new AppError(
        "You have already reviewed this booking.",
        httpStatus.CONFLICT,
      );
    }
    //create new review
    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        customerId: customer.id,
        serviceId: booking.serviceId,
        technicianId: booking.technicianId,
        rating: payload.rating,
        comment: payload.comment,
      },
      select: REVIEW_SELECT,
    });
    return review;
  }

  //--------------Update own Review-------------
  async updateReview(
    userId: string,
    reviewId: string,
    payload: TUpdateReviewPayload,
  ) {
    //if no data given
    ensureNotEmptyObject(payload);
    //get the customer
    const customer = await findCustomerProfileByUserId(userId);

    //update the review and technician's review aggregation
    const updatedReview = await prisma.$transaction(async (tx) => {
      //get the review and check
      const review = await tx.review.findUnique({
        where: { id: reviewId },
        select: { id: true, customerId: true, technicianId: true },
      });

      if (!review) {
        throw new AppError("Review not found.", httpStatus.NOT_FOUND);
      }
      if (review.customerId !== customer.id) {
        throw new AppError(
          "You can only update your own reviews.",
          httpStatus.FORBIDDEN,
        );
      }

      const result = await tx.review.update({
        where: { id: reviewId },
        data: payload,
        select: REVIEW_SELECT,
      });
      if (result.status === TReviewStatus.PUBLISHED) {
        await computeTechnicianRating(tx, review.technicianId);
      }
      return result;
    });
    return updatedReview;
  }

  //--------------Delete Review (own = customer, any = admin)-------------
  async deleteReview(userId: string, role: TRole, reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, customerId: true, technicianId: true },
    });
    if (!review) {
      throw new AppError("Review not found.", httpStatus.NOT_FOUND);
    }

    if (role === TRole.CUSTOMER) {
      const customer = await findCustomerProfileByUserId(userId);
      if (review.customerId !== customer.id) {
        throw new AppError(
          "You can only delete your own reviews.",
          httpStatus.FORBIDDEN,
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await computeTechnicianRating(tx, review.technicianId);
    });

    return { id: reviewId };
  }

  //--------------My Reviews-------------
  async getMyReviews(userId: string, query: TListReviewQuery) {
    const customer = await findCustomerProfileByUserId(userId);
    return this.reviewLists({ customerId: customer.id }, query);
  }

  //-------------PUBLIC ACTIONS--------------
  //--------------Technician's Review-------------
  async getTechnicianReviews(technicianId: string, query: TPublicReviewQuery) {
    return this.reviewLists(
      { technicianId, status: TReviewStatus.PUBLISHED },
      query,
    );
  }

  //-------------ADMIN ACTIONS----------
  //--------------All Review's-------------
  async getAllReviews(query: TListReviewQuery) {
    return this.reviewLists({}, query);
  }

  // Moderate: PENDING <-> PUBLISHED / HIDDEN / REJECTED
  async moderateReview(reviewId: string, status: TReviewStatus) {
    //get the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, technicianId: true },
    });
    if (!review) {
      throw new AppError("Review not found.", httpStatus.NOT_FOUND);
    }
    //update the review status
    const updatedReview = await prisma.$transaction(async (tx) => {
      const result = await tx.review.update({
        where: { id: reviewId },
        data: { status },
        select: REVIEW_SELECT,
      });
      await computeTechnicianRating(tx, review.technicianId);
      return result;
    });
    return updatedReview;
  }
}
export const reviewService = new ReviewService();
