import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { categoryController } from "./category.controller";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./category.validation";

export const categoryRoute: TRouteModule = {
  basePath: "",
  routes: [
    // ---------------Public----------------
    {
      method: "get",
      path: "/categories",
      handler: categoryController.getCategories,
    },
    // -------------------Admin--------------
    {
      method: "post",
      path: "/admin/categories",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(createCategorySchema),
      ),
      handler: categoryController.createCategory,
    },
    {
      method: "patch",
      path: "/admin/categories/:id",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(updateCategorySchema),
      ),
      handler: categoryController.updateCategory,
    },
  ],
};
