import { authRoute } from "../modules/auth/auth.route";
import { availabilitySlotRoute } from "../modules/availabilitySlot/availabilitySlot.route";
import { bookingRoute } from "../modules/booking/booking.route";
import { categoryRoute } from "../modules/category/category.route";
import { customerRoute } from "../modules/customer/customer.route";
import { notificationRoute } from "../modules/notification/notification.route";
import { paymentRoute } from "../modules/payment/payment.route";
import { reviewRoute } from "../modules/review/review.route";
import { serviceRoute } from "../modules/service/service.route";
import { technicianRoute } from "../modules/technician/technician.route";
import { userRoute } from "../modules/user/user.route";
import type { TRouteModule } from "./route.types";

export const routeRegistry: TRouteModule[] = [
  authRoute,
  technicianRoute,
  categoryRoute,
  serviceRoute,
  availabilitySlotRoute,
  bookingRoute,
  paymentRoute,
  reviewRoute,
  customerRoute,
  userRoute,
  notificationRoute,
];
