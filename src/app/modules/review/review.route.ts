import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { reviewController } from "./review.controller";
import {
  createReviewSchema,
  listReviewSchema,
  publicReviewListSchema,
  reviewIdParamSchema,
  updateReviewSchema,
  updateReviewStatusSchema,
} from "./review.validation";

export const reviewRoute: TRouteModule = {
  basePath: "",
  routes: [
    // ---------------Customer----------------
    {
      method: "get",
      path: "/reviews/my-reviews",
      middlewares: roleRoute(
        [TRole.CUSTOMER],
        validateRequest(listReviewSchema),
      ),
      handler: reviewController.getMyReviews,
    },
    {
      method: "post",
      path: "/reviews",
      middlewares: roleRoute(
        [TRole.CUSTOMER],
        validateRequest(createReviewSchema),
      ),
      handler: reviewController.createReview,
    },
    {
      method: "patch",
      path: "/reviews/:id",
      middlewares: roleRoute(
        [TRole.CUSTOMER],
        validateRequest(updateReviewSchema),
      ),
      handler: reviewController.updateReview,
    },
    {
      method: "delete",
      path: "/reviews/:id",
      middlewares: roleRoute(
        [TRole.CUSTOMER, TRole.ADMIN],
        validateRequest(reviewIdParamSchema),
      ),
      handler: reviewController.deleteReview,
    },
    // ---------------Public----------------
    {
      method: "get",
      path: "/technicians/:id/reviews",
      middlewares: [validateRequest(publicReviewListSchema)],
      handler: reviewController.getTechnicianReviews,
    },
    // ---------------Admin----------------
    {
      method: "get",
      path: "/admin/reviews",
      middlewares: roleRoute([TRole.ADMIN], validateRequest(listReviewSchema)),
      handler: reviewController.getAllReviews,
    },
    {
      method: "patch",
      path: "/admin/reviews/:id/status",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(updateReviewStatusSchema),
      ),
      handler: reviewController.moderateReview,
    },
  ],
};
