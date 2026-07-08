import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { paymentController } from "./payment.controller";
import { createPaymentSchema, listPaymentsSchema } from "./payment.validation";

export const paymentRoute: TRouteModule = {
  basePath: "",
  routes: [
    // ---------------Customer----------------
    {
      method: "post",
      path: "/payments/create",
      middlewares: roleRoute(
        [TRole.CUSTOMER],
        validateRequest(createPaymentSchema),
      ),
      handler: paymentController.createPayment,
    },

    {
      method: "get",
      path: "/payments/my-payments",
      middlewares: roleRoute(
        [TRole.CUSTOMER],
        validateRequest(listPaymentsSchema),
      ),
      handler: paymentController.getMyPayments,
    },

    // ---------------Admin----------------
    {
      method: "get",
      path: "/admin/payments",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(listPaymentsSchema),
      ),
      handler: paymentController.getAllPayments,
    },
    // ----------Gateway callbacks (PUBLIC)-------------
    {
      method: "post",
      path: "/payments/success",
      handler: paymentController.paymentSuccess,
    },
    {
      method: "post",
      path: "/payments/fail",
      handler: paymentController.paymentFail,
    },
    {
      method: "post",
      path: "/payments/cancel",
      handler: paymentController.paymentCancel,
    },
  ],
};
