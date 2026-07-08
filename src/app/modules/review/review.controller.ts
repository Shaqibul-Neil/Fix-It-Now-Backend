import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import { reviewService, type ReviewService } from "./review.service";
import type {
  TCreateReviewPayload,
  TListReviewQuery,
  TUpdateReviewPayload,
  TUpdateReviewStatusPayload,
} from "./review.validation";
import type { TRole } from "../../../../generated/prisma/enums";

class ReviewController {
  constructor(private reviewService: ReviewService) {}

  //-------------CUSTOMER ACTIONS----------
  //--------------Create Review-------------
  createReview = asyncHandler(async (req: TRequest, res: TResponse) => {
    const userId = req.user.id as string;
    const payload = req.body as TCreateReviewPayload;
    const result = await this.reviewService.createReview(userId, payload);

    sendResponse({
      res,
      status: httpStatus.CREATED,
      success: true,
      message: "Review submitted successfully",
      data: result,
    });
  });

  //--------------Update own Review-------------
  updateReview = asyncHandler(async (req: TRequest, res: TResponse) => {
    const reviewId = req.params.id as string;
    const payload = req.body as TUpdateReviewPayload;
    const result = await this.reviewService.updateReview(
      req.user.id,
      reviewId,
      payload,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Review updated successfully",
      data: result,
    });
  });

  //--------------Delete Reviews-------------
  deleteReview = asyncHandler(async (req: TRequest, res: TResponse) => {
    const userId = req.user.id;
    const reviewId = req.params.id as string;
    const role = req.user.role as TRole;
    const result = await this.reviewService.deleteReview(
      userId,
      role,
      reviewId,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Review deleted successfully",
      data: result,
    });
  });

  //--------------My Reviews-------------
  getMyReviews = asyncHandler(async (req: TRequest, res: TResponse) => {
    const userId = req.user.id;
    const query = req.query as TListReviewQuery;
    const { items, meta } = await this.reviewService.getMyReviews(
      userId,
      query,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Reviews fetched successfully",
      data: items,
      meta,
    });
  });

  //-------------PUBLIC ACTIONS----------
  getTechnicianReviews = asyncHandler(async (req: TRequest, res: TResponse) => {
    const technicianId = req.params.id as string;
    const query = req.query as TListReviewQuery;
    const { items, meta } = await this.reviewService.getTechnicianReviews(
      technicianId,
      query,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Reviews fetched successfully",
      data: items,
      meta,
    });
  });

  //-------------ADMIN ACTIONS----------
  //--------------All Review's-------------
  getAllReviews = asyncHandler(async (req: TRequest, res: TResponse) => {
    const query = req.query as TListReviewQuery;
    const { items, meta } = await this.reviewService.getAllReviews(query);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Reviews fetched successfully",
      data: items,
      meta,
    });
  });

  // Moderate: PENDING <-> PUBLISHED / HIDDEN / REJECTED
  moderateReview = asyncHandler(async (req: TRequest, res: TResponse) => {
    const reviewId = req.params.id as string;
    const { status } = req.body as TUpdateReviewStatusPayload;
    const result = await this.reviewService.moderateReview(reviewId, status);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Review status updated successfully",
      data: result,
    });
  });
}
export const reviewController = new ReviewController(reviewService);
