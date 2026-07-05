import type { TRouteModule } from "../../routes/route.types";
import { authController } from "./auth.controller";

export const authRoute: TRouteModule = {
  basePath: "auth",
  routes: [
    { method: "post", path: "/register", handler: authController.register },
  ],
};
