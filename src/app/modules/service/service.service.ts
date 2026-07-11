import httpStatus from "http-status";
import { Prisma, TRole } from "../../../../generated/prisma/client";
import { AppError } from "../../../utils/appError";
import { findTechnicianProfileByUserId } from "../technician/technician.utils";
import type {
  TCreateServicePayload,
  TListServicesQuery,
  TUpdateServicePayload,
} from "./service.validation";
import { prisma } from "../../../lib/prisma";
import {
  createFullName,
  ensureNotEmptyObject,
  getPagination,
} from "../../../utils/utils";
import { buildMyServiceFilter, buildServiceFilter } from "./service.utils";
import {
  notifyServiceCreated,
  notifyServiceUpdated,
  notifyServiceDeleted,
} from "../notification/notification.events";
import {
  SERVICE_CATEGORY_CHECK_SELECT,
  SERVICE_CREATED_INCLUDE,
  SERVICE_DELETE_SELECT,
  SERVICE_MY_LIST_INCLUDE,
  SERVICE_OWNERSHIP_SELECT,
  SERVICE_PUBLIC_LIST_INCLUDE,
  SERVICE_UPDATED_INCLUDE,
} from "./service.include";

export class ServiceService {
  //----------Category Must Exist----------
  private async isCategoryExist(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: SERVICE_CATEGORY_CHECK_SELECT,
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
  private async isServiceExist<T extends Prisma.ServiceSelect>(
    serviceId: string,
    select: T,
  ): Promise<Prisma.ServiceGetPayload<{ select: T }>> {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select,
    });
    if (!service) {
      throw new AppError("Service not found.", httpStatus.NOT_FOUND);
    }
    return service as Prisma.ServiceGetPayload<{ select: T }>;
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
      include: SERVICE_CREATED_INCLUDE,
    });

    const technicianName = createFullName(
      service.technician.users.firstName,
      service.technician.users.lastName,
    );

    //sending notification to admin
    await notifyServiceCreated(service.id, service.title, technicianName);
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
    const service = await this.isServiceExist(
      serviceId,
      SERVICE_OWNERSHIP_SELECT,
    );
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

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: payload,
      include: SERVICE_UPDATED_INCLUDE,
    });
    const technicianName = createFullName(
      updatedService.technician.users.firstName,
      updatedService.technician.users.lastName,
    );

    //sending notification to admin
    await notifyServiceUpdated(
      updatedService.id,
      updatedService.title,
      technicianName,
    );

    return updatedService;
  }

  //-------------Get Technician's Service-------------
  async getMyServices(userId: string, query: TListServicesQuery) {
    //get the technician profile
    const technician = await findTechnicianProfileByUserId(userId);

    // Prepare pagination
    const { page, limit, skip } = getPagination(query.page, query.limit);

    // Build filter conditions
    const where = buildMyServiceFilter(technician.id, query);

    //Get the service with data and count total
    const [items, total] = await prisma.$transaction([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: SERVICE_MY_LIST_INCLUDE,
      }),

      prisma.service.count({
        where,
      }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  //-------------TECHNICIAN + ADMIN ACTIONS----------
  //--------------Delete Service-------------
  async deleteService(userId: string, role: TRole, serviceId: string) {
    //Check the service
    const service = await this.isServiceExist(serviceId, SERVICE_DELETE_SELECT);

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

    //Delete service
    await prisma.service.delete({ where: { id: serviceId } });

    const technicianName = createFullName(
      service.technician.users.firstName,
      service.technician.users.lastName,
    );

    //send notification
    await notifyServiceDeleted(
      service.title,
      service.technician.userId,
      technicianName,
    );
    return { id: serviceId };
  }

  //------------------PUBLIC-----------------
  //--------------Get All Service-------------
  async getAllServices(query: TListServicesQuery) {
    // Prepare pagination
    const { page, limit, skip } = getPagination(query.page, query.limit);

    // Build filter conditions
    const where = buildServiceFilter(query);

    //Get the service with data and count total
    const [items, total] = await prisma.$transaction([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: SERVICE_PUBLIC_LIST_INCLUDE,
      }),
      prisma.service.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }
}

export const serviceService = new ServiceService();
