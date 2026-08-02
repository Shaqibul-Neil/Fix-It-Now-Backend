import { TRole } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../../middlewares/validate";
import { roleRoute } from "../../routes/route.helpers";
import type { TRouteModule } from "../../routes/route.types";
import { categoryController } from "./category.controller";
import {
  categoryIdParamSchema,
  createCategorySchema,
  listCategoryAdminSchema,
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
      method: "get",
      path: "/admin/categories",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(listCategoryAdminSchema),
      ),
      handler: categoryController.getCategoriesForAdmin,
    },
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
      method: "get",
      path: "/admin/categories/:id",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(categoryIdParamSchema),
      ),
      handler: categoryController.getCategoryByIdForAdmin,
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
    {
      method: "patch",
      path: "/admin/categories/:id/restore",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(categoryIdParamSchema),
      ),
      handler: categoryController.restoreCategory,
    },
    {
      method: "delete",
      path: "/admin/categories/:id",
      middlewares: roleRoute(
        [TRole.ADMIN],
        validateRequest(categoryIdParamSchema),
      ),
      handler: categoryController.deleteCategory,
    },
  ],
};
