import type { TRouteConfig, TRouteModule } from "../../routes/route.types";
import { adminStatsRoute } from "./admin/admin.stats.route";
import { customerStatsRoute } from "./customer/customer.stats.route";
import { technicianStatsRoute } from "./technician/technician.stats.route";

const prefixRoutes = (module: TRouteModule): TRouteConfig[] =>
  module.routes.map((route) => ({
    ...route,
    path: `/${module.basePath}${route.path}`,
  }));

export const statsRoute: TRouteModule = {
  basePath: "stats",
  routes: [
    ...prefixRoutes(adminStatsRoute),
    ...prefixRoutes(customerStatsRoute),
    ...prefixRoutes(technicianStatsRoute),
  ],
};
