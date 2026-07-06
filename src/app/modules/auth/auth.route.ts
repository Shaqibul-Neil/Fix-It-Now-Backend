import { validateRequest } from "../../../middlewares/validate";
import type { TRouteModule } from "../../routes/route.types";
import { authController } from "./auth.controller";
import {
  loginValidationSchema,
  registerValidationSchema,
} from "./auth.validation";

export const authRoute: TRouteModule = {
  basePath: "auth",
  routes: [
    {
      method: "post",
      path: "/register",
      middlewares: [validateRequest(registerValidationSchema)],
      handler: authController.register,
    },
    {
      method: "post",
      path: "/login",
      middlewares: [validateRequest(loginValidationSchema)],
      handler: authController.login,
    },
    {
      method: "post",
      path: "/refresh-token",
      handler: authController.refreshToken,
    },
  ],
};
