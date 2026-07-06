import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { technicianProfileController } from "./technicianProfile.controller";
import {
  createTechnicianProfileSchema,
  updateTechnicianProfileSchema,
} from "./technicianProfile.validation";

export const technicianProfileRoute: TRouteModule = {
  basePath: "technician/profile",
  routes: [
    {
      method: "post",
      path: "/",
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(createTechnicianProfileSchema),
      ),
      handler: technicianProfileController.createProfile,
    },
    {
      method: "patch",
      path: "/",
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(updateTechnicianProfileSchema),
      ),
      handler: technicianProfileController.updateProfile,
    },
    {
      method: "get",
      path: "/me",
      middlewares: roleRoute([TRole.TECHNICIAN]),
      handler: technicianProfileController.getMyProfile,
    },
  ],
};
