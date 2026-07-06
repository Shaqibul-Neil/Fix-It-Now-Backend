import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { serviceController } from "./service.controller";
import {
  createServiceSchema,
  listServicesSchema,
  serviceIdParamSchema,
  updateServiceSchema,
} from "./service.validation";

export const serviceRoute: TRouteModule = {
  basePath: "services",
  routes: [
    // public
    {
      method: "get",
      path: "/",
      middlewares: [validateRequest(listServicesSchema)],
      handler: serviceController.getAllServices,
    },
    // technician — own services
    {
      method: "get",
      path: "/my-services",
      middlewares: roleRoute([TRole.TECHNICIAN]),
      handler: serviceController.getMyServices,
    },
    {
      method: "post",
      path: "/",
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(createServiceSchema),
      ),
      handler: serviceController.createService,
    },
    {
      method: "patch",
      path: "/:id",
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(updateServiceSchema),
      ),
      handler: serviceController.updateService,
    },
    // delete — technician (own) OR admin (any)
    {
      method: "delete",
      path: "/:id",
      middlewares: roleRoute(
        [TRole.TECHNICIAN, TRole.ADMIN],
        validateRequest(serviceIdParamSchema),
      ),
      handler: serviceController.deleteService,
    },
  ],
};
