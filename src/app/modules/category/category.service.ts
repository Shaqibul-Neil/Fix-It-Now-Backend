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
  TListCategoryPublicQuery,
  TUpdateCategoryPayload,
} from "./category.validation";
import {
  ADMIN_CATEGORY_SELECT,
  CATEGORY_NAME_CONFLICT_SELECT,
  CATEGORY_WRITE_SELECT,
  PUBLIC_CATEGORY_DETAILS_SELECT,
  PUBLIC_CATEGORY_SELECT,
} from "./category.include";
import {
  categoryAdminMapper,
  categoryCardMapper,
  categoryDetailsMapper,
  categoryTopServiceMapper,
  categoryTopTechnicianMapper,
} from "./category.mapper";
import { LIVE_ONLY } from "../../../utils/recordStatus";
import { buildCategoryFilter } from "./category.utils";
import {
  notifyCategoryDeactivated,
  notifyCategoryReactivated,
} from "../notification/notification.events";
import {
  findCategoryServicesByIds,
  findCategoryTechnicians,
  findCheapestCategoryServices,
  findLiveCategories,
  findLiveCategoryBySlug,
  getCompletedJobsByTechnician,
} from "./category.model";
import { buildCategoryStats, EMPTY_CATEGORY_STATS } from "./category.stats";
import type {
  IRankedService,
  TCategoryTechnicianRow,
} from "./category.interface";

const TOP_TECHNICIAN_LIMIT = 6;
const TOP_SERVICE_LIMIT = 6;

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

  //----------Jobs each shown technician finished here----------
  private async attachCompletedJobs(
    categoryId: string,
    technicians: TCategoryTechnicianRow[],
  ) {
    if (technicians.length === 0) return [];

    const completed = await getCompletedJobsByTechnician(
      categoryId,
      technicians.map((technician) => technician.id),
    );

    const jobCounts = new Map(
      completed.map((row) => [row.technicianId, row._count._all]),
    );

    return technicians.map((technician) =>
      categoryTopTechnicianMapper(
        technician,
        jobCounts.get(technician.id) ?? 0,
      ),
    );
  }

  //----------The services strip on the landing page----------
  private async buildTopServices(
    categoryId: string,
    rankedServices: IRankedService[],
  ) {
    const bookingCounts = new Map(
      rankedServices
        .slice(0, TOP_SERVICE_LIMIT)
        .map((row) => [row.serviceId, row.totalBookings]),
    );
    const rankedIds = [...bookingCounts.keys()];

    const [rankedRows, fillerRows] = await Promise.all([
      findCategoryServicesByIds(categoryId, rankedIds),
      findCheapestCategoryServices(categoryId, rankedIds, TOP_SERVICE_LIMIT),
    ]);
    // The ranked rows come back in id order, so the booking counts put them back into the order they were picked in.
    const ordered = rankedRows.sort(
      (a, b) => (bookingCounts.get(b.id) ?? 0) - (bookingCounts.get(a.id) ?? 0),
    );

    return [...ordered, ...fillerRows]
      .slice(0, TOP_SERVICE_LIMIT)
      .map((service) =>
        categoryTopServiceMapper(service, bookingCounts.get(service.id) ?? 0),
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
        overview: payload.overview,
        tagline: payload.tagline,
        commonIssues: payload.commonIssues,
        image: payload.image,
        coverImage: payload.coverImage,
        isActive: payload.isActive,
        maintenanceType: payload.maintenanceType,
        maintenanceIntervalDays: payload.maintenanceIntervalDays,
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
  async getAllCategories(query: TListCategoryPublicQuery) {
    const categories = await findLiveCategories();
    if (categories.length === 0) return [];

    const stats = await buildCategoryStats(
      categories.map((category) => category.id),
    );

    const cards = categories.map((category) =>
      categoryCardMapper(
        category,
        stats.get(category.id) ?? EMPTY_CATEGORY_STATS,
      ),
    );

    if (query.sort === "popular") {
      const bookings = (categoryId: string) =>
        stats.get(categoryId)?.totalBookings ?? 0;

      cards.sort(
        (a, b) =>
          bookings(b.id) - bookings(a.id) ||
          b.serviceCount - a.serviceCount ||
          a.name.localeCompare(b.name),
      );
    }

    if (query.sort === "trending") {
      cards.sort(
        (a, b) =>
          Number(b.isTrending) - Number(a.isTrending) ||
          b.serviceCount - a.serviceCount ||
          a.name.localeCompare(b.name),
      );
    }

    return query.limit ? cards.slice(0, query.limit) : cards;
  }
  //-------------------------------------------
  //--------------Category details-------------
  //-------------------------------------------
  async getCategoryBySlug(slug: string) {
    const category = await findLiveCategoryBySlug(generateSlug(slug));

    if (!category) {
      throw new AppError("Category not found.", httpStatus.NOT_FOUND);
    }

    const statsByCategory = await buildCategoryStats([category.id]);
    const stats = statsByCategory.get(category.id) ?? EMPTY_CATEGORY_STATS;

    const [technicians, topServices] = await Promise.all([
      findCategoryTechnicians(category.id, TOP_TECHNICIAN_LIMIT),
      this.buildTopServices(category.id, stats.rankedServices),
    ]);

    const topTechnicians = await this.attachCompletedJobs(
      category.id,
      technicians,
    );

    return categoryDetailsMapper({
      category,
      stats,
      topTechnicians,
      topServices,
    });
  }
}

export const categoryService = new CategoryService();
