import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { paymentController } from "./payment.controller";
import { createPaymentSchema } from "./payment.validation";

export const paymentRoute: TRouteModule = {
  basePath: "payments",
  routes: [
    // ---------------Customer----------------
    {
      method: "post",
      path: "/create",
      middlewares: roleRoute(
        [TRole.CUSTOMER],
        validateRequest(createPaymentSchema),
      ),
      handler: paymentController.createPayment,
    },
  ],
};
