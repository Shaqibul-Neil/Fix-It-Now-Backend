import { authRoute } from "../modules/auth/auth.route";
import { availabilitySlotRoute } from "../modules/availabilitySlot/availabilitySlot.route";
import { bookingRoute } from "../modules/booking/booking.route";
import { categoryRoute } from "../modules/category/category.route";
import { serviceRoute } from "../modules/service/service.route";
import { technicianProfileRoute } from "../modules/technicianProfile/technicianProfile.route";
import type { TRouteModule } from "./route.types";

export const routeRegistry: TRouteModule[] = [
  authRoute,
  technicianProfileRoute,
  categoryRoute,
  serviceRoute,
  availabilitySlotRoute,
  bookingRoute,
];
