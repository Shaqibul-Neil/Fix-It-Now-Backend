import { TRole } from "../../../../../generated/prisma/enums";
import { validateRequest } from "../../../../middlewares/validate";
import { roleRoute } from "../../../routes/route.helpers";
import type { TRouteModule } from "../../../routes/route.types";
import { statsPeriodSchema } from "../stats.validation";
import { technicianStatsController } from "./technician.stats.controller";

export const technicianStatsRoute: TRouteModule = {
  basePath: "technician",
  routes: [
    {
      method: "get",
      path: "/dashboard",
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(statsPeriodSchema),
      ),
      handler: technicianStatsController.getTechnicianDashboard,
    },
    {
      method: "get",
      path: "/dashboard/recent-requests",
      middlewares: roleRoute([TRole.TECHNICIAN]),
      handler: technicianStatsController.getTechnicianRecentRequests,
    },
  ],
};
