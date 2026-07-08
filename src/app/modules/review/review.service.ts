import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import { findCustomerProfileByUserId } from "../customer/customer.utils";
import type {
  TCreateReviewPayload,
  TUpdateReviewPayload,
} from "./review.validation";
import {
  TBookingStatus,
  TReviewStatus,
} from "../../../../generated/prisma/enums";
import { ensureNotEmptyObject } from "../../../utils/utils";
import { REVIEW_SELECT } from "./review.include";
import { computeTechnicianRating } from "./review.utils";

export class ReviewService {
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
  async deleteReview() {}

  //--------------My Reviews-------------
  async getMyReviews() {
    //what about technician's own reviews if he wants to check
  }

  //-------------PUBLIC ACTIONS----------
  async getTechnicianReviews() {}

  //-------------ADMIN ACTIONS----------
  async getAllReviews() {}
  async getReviewDetails() {}

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

  // ---------------Dashboard metrics-------------
  async getReviewStats() {}
}
export const reviewService = new ReviewService();
