import type { TRouteModule } from "../../../routes/route.types";
import { TRole } from "../../../../../generated/prisma/enums";
import { roleRoute } from "../../../routes/route.helpers";
import { customerStatsController } from "./customer.stats.controller";

export const customerStatsRoute: TRouteModule = {
  basePath: "customer",
  routes: [
    {
      method: "get",
      path: "/dashboard",
      middlewares: roleRoute([TRole.CUSTOMER]),
      handler: customerStatsController.getCustomerDashboard,
    },
  ],
};
