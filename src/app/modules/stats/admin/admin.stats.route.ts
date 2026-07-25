import { TRole } from "../../../../../generated/prisma/enums";
import { validateRequest } from "../../../../middlewares/validate";
import { roleRoute } from "../../../routes/route.helpers";
import type { TRouteModule } from "../../../routes/route.types";
import { adminStatsController } from "./admin.stats.controller";
import { statsPeriodSchema } from "../stats.validation";

export const adminStatsRoute: TRouteModule = {
  basePath: "admin",
  routes: [
    {
      method: "get",
      path: "/dashboard",
      middlewares: roleRoute([TRole.ADMIN], validateRequest(statsPeriodSchema)),
      handler: adminStatsController.getAdminDashboard,
    },
  ],
};
