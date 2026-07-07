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
  basePath: "",
  routes: [
    // public
    {
      method: "get",
      path: "/services",
      middlewares: [validateRequest(listServicesSchema)],
      handler: serviceController.getAllServices,
    },
    // technician — own services
    {
      method: "get",
      path: "/technician/services/my-services",
      middlewares: roleRoute([TRole.TECHNICIAN]),
      handler: serviceController.getMyServices,
    },
    {
      method: "post",
      path: "/services",
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(createServiceSchema),
      ),
      handler: serviceController.createService,
    },
    {
      method: "patch",
      path: "/services/:id",
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(updateServiceSchema),
      ),
      handler: serviceController.updateService,
    },
    // delete — technician (own) OR admin
    {
      method: "delete",
      path: "/services/:id",
      middlewares: roleRoute(
        [TRole.TECHNICIAN, TRole.ADMIN],
        validateRequest(serviceIdParamSchema),
      ),
      handler: serviceController.deleteService,
    },
  ],
};
