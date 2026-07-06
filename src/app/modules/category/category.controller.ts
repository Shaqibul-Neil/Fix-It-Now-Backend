import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import { categoryService, type CategoryService } from "./category.service";
import type {
  TCreateCategoryPayload,
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

  //--------------Delete Category-------------
  deleteCategory = asyncHandler(async (req: TRequest, res: TResponse) => {
    const categoryId = req.params.id as string;

    await this.categoryService.deleteCategory(categoryId);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Category deleted successfully",
    });
  });

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
