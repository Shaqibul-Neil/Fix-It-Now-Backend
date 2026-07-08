import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { userController } from "./user.controller";
import { listUsersSchema, updateUserStatusSchema } from "./user.validation";

export const userRoute: TRouteModule = {
  basePath: "admin",
  routes: [
    {
      method: "get",
      path: "/users",
      middlewares: roleRoute([TRole.ADMIN], validateRequest(listUsersSchema)),
      handler: userController.getAllUsers,
    },
    {
      method: "patch",
      path: "/users/:id",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(updateUserStatusSchema),
      ),
      handler: userController.updateUserStatus,
    },
  ],
};
