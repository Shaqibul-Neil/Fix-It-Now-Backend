import httpStatus from "http-status";
import type { Category } from "../../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import { ensureNotEmptyObject, generateSlug } from "../../../utils/utils";
import type {
  TCreateCategoryPayload,
  TUpdateCategoryPayload,
} from "./category.validation";

export class CategoryService {
  //------------------ADMIN ACTIONS----------
  //--------------Create Category-------------
  async createCategory(payload: TCreateCategoryPayload): Promise<Category> {
    const slug = generateSlug(payload.slug ?? payload.name);

    //name + slug are unique so prisma throws error
    const category = await prisma.category.create({
      data: {
        name: payload.name,
        slug,
        description: payload.description,
        isActive: payload.isActive,
      },
    });

    return category;
  }

  //--------------Update Category-------------
  async updateCategory(
    categoryId: string,
    payload: TUpdateCategoryPayload,
  ): Promise<Category> {
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!existingCategory)
      throw new AppError("Category not found.", httpStatus.NOT_FOUND);

    //If no data is given
    ensureNotEmptyObject(payload);

    //creating slug
    const data = {
      ...payload,
      ...(payload.name && { slug: generateSlug(payload.name) }),
    };

    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
    });

    return category;
  }

  //------------------PUBLIC---------------
  //---------------All Category--------------
  async getAllCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: {
        name: "asc",
      },
    });
  }
}

export const categoryService = new CategoryService();
