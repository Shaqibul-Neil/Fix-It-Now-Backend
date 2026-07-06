import { authRoute } from "../modules/auth/auth.route";
import { technicianProfileRoute } from "../modules/technicianProfile/technicianProfile.route";
import type { TRouteModule } from "./route.types";

export const routeRegistry: TRouteModule[] = [
  authRoute,
  technicianProfileRoute,
];
