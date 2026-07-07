import httpStatus from "http-status";
import { Prisma, TRole } from "../../../../generated/prisma/client";
import { AppError } from "../../../utils/appError";
import { findTechnicianProfileByUserId } from "../technicianProfile/technicianProfile.utils";
import type {
  TCreateServicePayload,
  TListServicesQuery,
  TUpdateServicePayload,
} from "./service.validation";
import { prisma } from "../../../lib/prisma";
import { ensureNotEmptyObject, generateSlug } from "../../../utils/utils";

export class ServiceService {
  //----------Category Must Exist----------
  private async isCategoryExist(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, isActive: true },
    });
    if (!category) {
      throw new AppError("Category not found.", httpStatus.NOT_FOUND);
    }
    if (!category.isActive) {
      throw new AppError(
        "This category is not active.",
        httpStatus.BAD_REQUEST,
      );
    }
  }

  //----------Check Service----------
  private async isServiceExist(serviceId: string) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        technicianId: true,
      },
    });
    if (!service) {
      throw new AppError("Service not found.", httpStatus.NOT_FOUND);
    }
    return service;
  }

  //-------------TECHNICIAN ACTIONS----------
  //--------------Create Service-------------
  async createService(userId: string, payload: TCreateServicePayload) {
    //get the technician profile
    const technician = await findTechnicianProfileByUserId(userId);

    //get the category
    await this.isCategoryExist(payload.categoryId);

    //create the service
    const service = await prisma.service.create({
      data: {
        technicianId: technician.id,
        categoryId: payload.categoryId,
        title: payload.title,
        description: payload.description,
        price: payload.price,
        estimatedDuration: payload.estimatedDuration,
        isActive: payload.isActive ?? true,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });
    return service;
  }

  //--------------Update Service-------------
  async updateService(
    userId: string,
    serviceId: string,
    payload: TUpdateServicePayload,
  ) {
    //get the technician profile
    const technician = await findTechnicianProfileByUserId(userId);
    //get the service
    const service = await this.isServiceExist(serviceId);
    if (service.technicianId !== technician.id) {
      throw new AppError(
        "You can only edit your own services.",
        httpStatus.FORBIDDEN,
      );
    }

    //Check category
    if (payload.categoryId) {
      await this.isCategoryExist(payload.categoryId);
    }

    //If no data given
    ensureNotEmptyObject(payload);

    return prisma.service.update({
      where: { id: serviceId },
      data: payload,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  //-------------Get Technician's Service-------------
  async getMyServices(userId: string) {
    const technician = await findTechnicianProfileByUserId(userId);
    return prisma.service.findMany({
      where: { technicianId: technician.id },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  //-------------TECHNICIAN + ADMIN ACTIONS----------
  //--------------Delete Service-------------
  async deleteService(userId: string, role: TRole, serviceId: string) {
    const service = await this.isServiceExist(serviceId);

    //Technician can only delete their service
    if (role === TRole.TECHNICIAN) {
      const technician = await findTechnicianProfileByUserId(userId);
      if (service.technicianId !== technician.id) {
        throw new AppError(
          "You can only delete your own services.",
          httpStatus.FORBIDDEN,
        );
      }
    }

    //Check If booking exists
    const bookingCount = await prisma.booking.count({
      where: { serviceId },
    });
    if (bookingCount > 0) {
      throw new AppError(
        "Cannot delete a service that has bookings.",
        httpStatus.CONFLICT,
      );
    }

    await prisma.service.delete({ where: { id: serviceId } });
    return { id: serviceId };
  }

  //------------------PUBLIC-----------------
  //--------------Get All Service-------------
  async getAllServices(query: TListServicesQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const whereCondition: Prisma.ServiceWhereInput = {
      isActive: true,
      technician: {
        isProfileComplete: true,
        //filtering on technicians profile
        ...(query.city
          ? { city: { contains: query.city, mode: "insensitive" as const } }
          : {}),
        ...(query.area
          ? { area: { contains: query.area, mode: "insensitive" as const } }
          : {}),
        ...(query.minRating !== undefined
          ? { averageRating: { gte: query.minRating } }
          : {}),
      },
      //filtering on services
      ...(query.category
        ? { category: { slug: generateSlug(query.category) } }
        : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: "insensitive" as const } }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      //data list
      prisma.service.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: {
            select: { id: true, name: true },
          },
          technician: {
            select: {
              id: true,
              city: true,
              area: true,
              averageRating: true,
              hourlyRate: true,
              users: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      //total
      prisma.service.count({ where: whereCondition }),
    ]);

    return { items, meta: { page, limit, total } };
  }
}

export const serviceService = new ServiceService();
