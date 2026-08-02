import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import {
  ensureNotEmptyObject,
  generateSlug,
  getPagination,
} from "../../../utils/utils";
import type {
  TCreateCategoryPayload,
  TListCategoryAdminQuery,
  TUpdateCategoryPayload,
} from "./category.validation";
import {
  ADMIN_CATEGORY_SELECT,
  CATEGORY_NAME_CONFLICT_SELECT,
  CATEGORY_WRITE_SELECT,
  PUBLIC_CATEGORY_SELECT,
} from "./category.include";
import { categoryAdminMapper } from "./category.mapper";
import { LIVE_ONLY } from "../../../utils/recordStatus";
import { buildCategoryFilter } from "./category.utils";
import {
  notifyCategoryDeactivated,
  notifyCategoryReactivated,
} from "../notification/notification.events";

export class CategoryService {
  //----------Category Must Exist----------
  private async findWritableCategory(
    categoryId: string,
    { allowDeleted = false }: { allowDeleted?: boolean } = {},
  ) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: CATEGORY_WRITE_SELECT,
    });

    if (!category) {
      throw new AppError("Category not found.", httpStatus.NOT_FOUND);
    }

    if (!allowDeleted && category.deletedAt) {
      throw new AppError("Category not found.", httpStatus.NOT_FOUND);
    }

    return category;
  }

  //----------Name Must Be Free----------
  private async ensureCategoryNameIsFree(
    name: string,
    slug: string,
    excludeCategoryId?: string,
  ) {
    const conflictingCategory = await prisma.category.findFirst({
      where: {
        ...(excludeCategoryId && { id: { not: excludeCategoryId } }),
        OR: [{ name }, { slug }],
      },
      select: CATEGORY_NAME_CONFLICT_SELECT,
    });

    if (!conflictingCategory) return;
    throw new AppError(
      conflictingCategory.deletedAt
        ? `A removed category named "${conflictingCategory.name}" already uses this name. Restore it instead of creating a duplicate.`
        : "A category with this name already exists.",
      httpStatus.CONFLICT,
    );
  }

  //----------Who Loses Visibility----------
  private async findTechniciansAffectedByCategory(categoryId: string) {
    const affectedServices = await prisma.service.findMany({
      where: { categoryId, ...LIVE_ONLY },
      select: { technician: { select: { userId: true } } },
    });

    return {
      affectedServiceCount: affectedServices.length,
      affectedTechnicianUserIds: [
        ...new Set(
          affectedServices.map((service) => service.technician.userId),
        ),
      ],
    };
  }

  //-------------------------------------------
  //------------------ADMIN ACTIONS----------
  //--------------Create Category-------------
  //-------------------------------------------
  async createCategory(payload: TCreateCategoryPayload) {
    const slug = generateSlug(payload.slug ?? payload.name);

    await this.ensureCategoryNameIsFree(payload.name, slug);

    const category = await prisma.category.create({
      data: {
        name: payload.name,
        slug,
        description: payload.description,
        image: payload.image,
        isActive: payload.isActive,
      },
      select: ADMIN_CATEGORY_SELECT,
    });

    return categoryAdminMapper(category);
  }

  //-------------------------------------------
  //--------------Update Category-------------
  //-------------------------------------------
  async updateCategory(categoryId: string, payload: TUpdateCategoryPayload) {
    const existingCategory = await this.findWritableCategory(categoryId);

    //If no data is given
    ensureNotEmptyObject(payload);

    // Renaming re-derives the slug, and the new slug can collide exactly the  way a create can — so the same check runs, minus this row itself.
    const slug = payload.name ? generateSlug(payload.name) : undefined;
    if (payload.name && slug) {
      await this.ensureCategoryNameIsFree(payload.name, slug, categoryId);
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { ...payload, ...(slug && { slug }) },
      select: ADMIN_CATEGORY_SELECT,
    });

    const isDeactivating = existingCategory.isActive && !category.isActive;
    const isReactivating = !existingCategory.isActive && category.isActive;

    if (isDeactivating || isReactivating) {
      const { affectedTechnicianUserIds } =
        await this.findTechniciansAffectedByCategory(categoryId);
      if (isDeactivating) {
        await notifyCategoryDeactivated(
          category.name,
          affectedTechnicianUserIds,
        );
      } else {
        await notifyCategoryReactivated(
          category.name,
          affectedTechnicianUserIds,
        );
      }
    }

    return categoryAdminMapper(category);
  }

  //-------------------------------------------
  //--------------Delete Category (soft)-------------
  //-------------------------------------------
  async deleteCategory(categoryId: string) {
    const category = await this.findWritableCategory(categoryId);

    // The services under it are not touched. They stop appearing because every public read filters on a live category — and if the category comes back, so does everything under it, untouched. The count goes back to the admin
    const { affectedServiceCount, affectedTechnicianUserIds } =
      await this.findTechniciansAffectedByCategory(categoryId);

    // Removal writes deletedAt only. isActive answers whether the category was being offered before it went away — a seasonal one switched off in winter has to come back switched off, or a restore in March silently republishes every service sitting under it.
    const deletedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { deletedAt: new Date() },
      select: CATEGORY_WRITE_SELECT,
    });

    // A category that was already switched off had its technicians told once. Removing it takes nothing further off the public list, so saying it again is noise.
    if (category.isActive) {
      await notifyCategoryDeactivated(category.name, affectedTechnicianUserIds);
    }

    return { ...deletedCategory, affectedServiceCount };
  }

  //-------------------------------------------
  //--------------Restore Category-------------
  //-------------------------------------------
  async restoreCategory(categoryId: string) {
    const category = await this.findWritableCategory(categoryId, {
      allowDeleted: true,
    });

    if (!category.deletedAt) {
      throw new AppError("This category is not removed.", httpStatus.CONFLICT);
    }

    // Clears the removal and nothing else, so the category comes back on whichever side of the isActive switch it was left on.
    const restoredCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { deletedAt: null },
      select: ADMIN_CATEGORY_SELECT,
    });

    // A restore that leaves the category switched off puts nothing back on the public list, so there is nothing a technician can act on yet — the same reason restoreUser stays quiet when an account comes back still banned. The services were never touched, so when the category is live again they come back with it and the technicians who lost visibility get it back.
    if (restoredCategory.isActive) {
      const { affectedTechnicianUserIds } =
        await this.findTechniciansAffectedByCategory(categoryId);

      await notifyCategoryReactivated(
        restoredCategory.name,
        affectedTechnicianUserIds,
      );
    }

    return categoryAdminMapper(restoredCategory);
  }

  //-------------------------------------------
  //------------Admin: category list-----------
  //-------------------------------------------
  async getAllCategoriesForAdmin(query: TListCategoryAdminQuery) {
    const { page, limit, skip } = getPagination(query.page, query.limit);
    const where = buildCategoryFilter(query);

    const [items, total] = await prisma.$transaction([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        select: ADMIN_CATEGORY_SELECT,
      }),
      prisma.category.count({ where }),
    ]);
    return {
      items: items.map(categoryAdminMapper),
      meta: { page, limit, total },
    };
  }

  //-------------------------------------------
  //---------Admin: category details-----------
  //-------------------------------------------
  async getCategoryByIdForAdmin(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: ADMIN_CATEGORY_SELECT,
    });

    if (!category) {
      throw new AppError("Category not found.", httpStatus.NOT_FOUND);
    }

    return categoryAdminMapper(category);
  }

  //-------------------------------------------
  //------------------PUBLIC---------------
  //---------------All Category--------------
  //-------------------------------------------
  async getAllCategories() {
    return prisma.category.findMany({
      where: LIVE_ONLY,
      orderBy: {
        name: "asc",
      },
      select: PUBLIC_CATEGORY_SELECT,
    });
  }
}

export const categoryService = new CategoryService();
