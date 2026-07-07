import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { protectedRoute, roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { bookingController } from "./booking.controller";
import {
  bookingIdParamSchema,
  createBookingSchema,
  listBookingsSchema,
  updateBookingStatusSchema,
} from "./booking.validation";

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
    {
      method: "patch",
      path: "/bookings/:id/cancel",
      middlewares: roleRoute(
        [TRole.CUSTOMER],
        validateRequest(bookingIdParamSchema),
      ),
      handler: bookingController.cancelBooking,
    },
    {
      method: "get",
      path: "/bookings",
      middlewares: roleRoute(
        [TRole.CUSTOMER],
        validateRequest(listBookingsSchema),
      ),
      handler: bookingController.getCustomerBookingsList,
    },
    {
      method: "get",
      path: "/bookings/:id",
      middlewares: protectedRoute(validateRequest(listBookingsSchema)),
      handler: bookingController.getBookingDetails,
    },

    // ---------------Technician----------------
    {
      method: "get",
      path: "/technician/bookings",
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(listBookingsSchema),
      ),
      handler: bookingController.getTechnicianBookingsList,
    },
    {
      method: "patch",
      path: "/technician/bookings/:id",
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(updateBookingStatusSchema),
      ),
      handler: bookingController.updateBookingStatus,
    },
    // ---------------Admin----------------
    {
      method: "get",
      path: "/admin/bookings",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(listBookingsSchema),
      ),
      handler: bookingController.getAllBookingsList,
    },
  ],
};
