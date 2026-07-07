import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { protectedRoute, roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { bookingController } from "./booking.controller";
import { createBookingSchema } from "./booking.validation";

export const bookingRoute: TRouteModule = {
  basePath: "",
  routes: [
    // ---------------Customer----------------
    {
      method: "post",
      path: "/bookings",
      middlewares: roleRoute(
        [TRole.CUSTOMER],
        validateRequest(createBookingSchema),
      ),
      handler: bookingController.createBooking,
    },
  ],
};
