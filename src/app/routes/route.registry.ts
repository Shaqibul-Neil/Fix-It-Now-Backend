import { authRoute } from "../modules/auth/auth.route";
import type { TRouteModule } from "./route.types";

export const routeRegistry: TRouteModule[] = [authRoute];
