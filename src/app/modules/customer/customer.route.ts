import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { customerController } from "./customer.controller";
import { updateCustomerProfileSchema } from "./customer.validation";

export const customerRoute: TRouteModule = {
  basePath: "customer",
  routes: [
    {
      method: "get",
      path: "/profile/me",
      middlewares: roleRoute([TRole.CUSTOMER]),
      handler: customerController.getMyProfile,
    },
    {
      method: "patch",
      path: "/profile",
      middlewares: roleRoute(
        [TRole.CUSTOMER],
        validateRequest(updateCustomerProfileSchema),
      ),
      handler: customerController.updateProfile,
    },
  ],
};
