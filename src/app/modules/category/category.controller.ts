import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import { categoryService, type CategoryService } from "./category.service";
import type {
  TCreateCategoryPayload,
  TListCategoryAdminQuery,
  TUpdateCategoryPayload,
} from "./category.validation";

class CategoryController {
  constructor(private categoryService: CategoryService) {}

  //------------------ADMIN ACTIONS----------
  //--------------Create Category-------------
  createCategory = asyncHandler(async (req: TRequest, res: TResponse) => {
    const payload = req.body as TCreateCategoryPayload;
    const category = await this.categoryService.createCategory(payload);

    sendResponse({
      res,
      status: httpStatus.CREATED,
      success: true,
      message: "Category created successfully",
      data: category,
    });
  });

  //--------------Update Category-------------
  updateCategory = asyncHandler(async (req: TRequest, res: TResponse) => {
    const categoryId = req.params.id as string;
    const payload = req.body as TUpdateCategoryPayload;
    const category = await this.categoryService.updateCategory(
      categoryId,
      payload,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  });

  //--------------Delete Category (soft)-------------
  deleteCategory = asyncHandler(async (req: TRequest, res: TResponse) => {
    const categoryId = req.params.id as string;

    const result = await this.categoryService.deleteCategory(categoryId);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Category deleted successfully",
      data: result,
    });
  });

  //--------------Restore Category-------------
  restoreCategory = asyncHandler(async (req: TRequest, res: TResponse) => {
    const categoryId = req.params.id as string;
    const category = await this.categoryService.restoreCategory(categoryId);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Category restored successfully",
      data: category,
    });
  });

  //--------------Admin: category list-------------
  getCategoriesForAdmin = asyncHandler(
    async (req: TRequest, res: TResponse) => {
      const query = req.query as TListCategoryAdminQuery;
      const { items, meta } =
        await this.categoryService.getAllCategoriesForAdmin(query);

      sendResponse({
        res,
        status: httpStatus.OK,
        success: true,
        message: "Categories fetched successfully",
        data: items,
        meta,
      });
    },
  );

  //--------------Admin: category detail-------------
  getCategoryByIdForAdmin = asyncHandler(
    async (req: TRequest, res: TResponse) => {
      const categoryId = req.params.id as string;
      const category =
        await this.categoryService.getCategoryByIdForAdmin(categoryId);

      sendResponse({
        res,
        status: httpStatus.OK,
        success: true,
        message: "Category details fetched successfully",
        data: category,
      });
    },
  );

  //------------------PUBLIC---------------
  //---------------All Category--------------
  getCategories = asyncHandler(async (req: TRequest, res: TResponse) => {
    const categories = await this.categoryService.getAllCategories();

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  });
}

export const categoryController = new CategoryController(categoryService);
