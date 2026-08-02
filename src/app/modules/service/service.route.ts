import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { serviceController } from "./service.controller";
import {
  createServiceSchema,
  listManagedServicesSchema,
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
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(listManagedServicesSchema),
      ),
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
    //restore - technician (own) OR admin
    {
      method: "patch",
      path: "/services/:id/restore",
      middlewares: roleRoute(
        [TRole.TECHNICIAN, TRole.ADMIN],
        validateRequest(serviceIdParamSchema),
      ),
      handler: serviceController.restoreService,
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

    // admin — service list + detail
    {
      method: "get",
      path: "/services/admin/list",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(listManagedServicesSchema),
      ),
      handler: serviceController.getAllServicesForAdmin,
    },
    {
      method: "get",
      path: "/services/admin/:id",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(serviceIdParamSchema),
      ),
      handler: serviceController.getServiceByIdForAdmin,
    },
  ],
};
