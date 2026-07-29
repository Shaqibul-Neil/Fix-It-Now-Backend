import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { technicianController } from "./technician.controller";
import {
  adminListTechniciansSchema,
  createTechnicianProfileSchema,
  listTechniciansSchema,
  reviewTechnicianSchema,
  technicianIdParamSchema,
  updateTechnicianProfileSchema,
} from "./technician.validation";

export const technicianRoute: TRouteModule = {
  basePath: "technicians",
  routes: [
    // ---------------Technician----------------
    {
      method: "post",
      path: "/profile",
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(createTechnicianProfileSchema),
      ),
      handler: technicianController.createProfile,
    },
    {
      method: "patch",
      path: "/profile",
      middlewares: roleRoute(
        [TRole.TECHNICIAN],
        validateRequest(updateTechnicianProfileSchema),
      ),
      handler: technicianController.updateProfile,
    },
    {
      method: "get",
      path: "/profile/me",
      middlewares: roleRoute([TRole.TECHNICIAN]),
      handler: technicianController.getMyProfile,
    },

    // ---------------Public----------------
    {
      method: "get",
      path: "/",
      middlewares: [validateRequest(listTechniciansSchema)],
      handler: technicianController.getAllTechnicians,
    },
    {
      method: "get",
      path: "/:id",
      middlewares: [validateRequest(technicianIdParamSchema)],
      handler: technicianController.getTechnicianById,
    },

    // ---------------Admin----------------
    {
      method: "get",
      path: "/admin/list",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(adminListTechniciansSchema),
      ),
      handler: technicianController.getAllTechniciansForAdmin,
    },
    {
      method: "get",
      path: "/admin/:id",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(technicianIdParamSchema),
      ),
      handler: technicianController.getTechnicianByIdForAdmin,
    },
    {
      method: "patch",
      path: "/admin/:id/approval",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(reviewTechnicianSchema),
      ),
      handler: technicianController.reviewTechnician,
    },
  ],
};
