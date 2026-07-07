import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { availabilityController } from "./availabilitySlot.controller";
import { setAvailabilitySchema } from "./availabilitySlot.validation";

export const availabilitySlotRoute: TRouteModule = {
  basePath: "technician/availability",
  routes: [
    {
      method: "put",
      path: "/",
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(setAvailabilitySchema),
      ),
      handler: availabilityController.setMyAvailability,
    },
    {
      method: "get",
      path: "/",
      middlewares: roleRoute([TRole.TECHNICIAN]),
      handler: availabilityController.getMyAvailability,
    },
  ],
};
