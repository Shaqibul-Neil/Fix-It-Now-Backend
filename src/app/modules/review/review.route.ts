import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { reviewController } from "./review.controller";
import {
  createReviewSchema,
  updateReviewSchema,
  updateReviewStatusSchema,
} from "./review.validation";

export const reviewRoute: TRouteModule = {
  basePath: "",
  routes: [
    // ---------------Customer----------------
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
    // ---------------Admin----------------
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
