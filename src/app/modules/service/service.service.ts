import httpStatus from "http-status";
import { Prisma, TRole } from "../../../../generated/prisma/client";
import { AppError } from "../../../utils/appError";
import {
  findApprovedTechnicianProfile,
  findTechnicianProfileByUserId,
} from "../technician/technician.model";
import type {
  TCreateServicePayload,
  TListManagedServicesQuery,
  TListServicesQuery,
  TUpdateServicePayload,
} from "./service.validation";
import { prisma } from "../../../lib/prisma";
import {
  createFullName,
  ensureNotEmptyObject,
  getPagination,
} from "../../../utils/utils";
import {
  buildAdminServiceFilter,
  buildMyServiceFilter,
  buildServiceFilter,
} from "./service.utils";
import {
  notifyServiceCreated,
  notifyServiceUpdated,
  notifyServiceDeleted,
  notifyServiceRestored,
} from "../notification/notification.events";
import {
  ADMIN_SERVICE_LIST_INCLUDE,
  SERVICE_CATEGORY_CHECK_SELECT,
  SERVICE_CREATED_INCLUDE,
  SERVICE_DELETED_INCLUDE,
  SERVICE_DETAILS_INCLUDE,
  SERVICE_MY_LIST_INCLUDE,
  SERVICE_PUBLIC_LIST_INCLUDE,
  SERVICE_UPDATED_INCLUDE,
  SERVICE_WRITE_SELECT,
} from "./service.include";
import { getBookingStatusBreakdown } from "../booking/booking.model";
import {
  serviceAdminListMapper,
  servicePublicListMapper,
  serviceTechnicianListMapper,
} from "./service.mapper";
import { ACTIVE_BOOKING_STATUSES } from "../booking/booking.constants";

export class ServiceService {
  //----------Category Must Exist----------
  private async isCategoryExist(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: SERVICE_CATEGORY_CHECK_SELECT,
    });
    if (!category || category.deletedAt) {
      throw new AppError("Category not found.", httpStatus.NOT_FOUND);
    }
    if (!category.isActive) {
      throw new AppError(
        "This category is not active.",
        httpStatus.BAD_REQUEST,
      );
    }
  }
  //----------Service Must Exist----------
  private async findWritableService(
    serviceId: string,
    { allowDeleted = false }: { allowDeleted?: boolean } = {},
  ) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: SERVICE_WRITE_SELECT,
    });
    if (!service) {
      throw new AppError("Service not found.", httpStatus.NOT_FOUND);
    }

    if (!allowDeleted && service.deletedAt) {
      throw new AppError("Service not found.", httpStatus.NOT_FOUND);
    }

    return service;
  }

  //-------------------------------------------
  //-------------TECHNICIAN ACTIONS----------
  //--------------Create Service-------------
  //-------------------------------------------
  async createService(userId: string, payload: TCreateServicePayload) {
    //get the approved technician profile
    const technician = await findApprovedTechnicianProfile(userId);

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

  //-------------------------------------------
  //--------------Update Service-------------
  //-------------------------------------------
  async updateService(
    userId: string,
    serviceId: string,
    payload: TUpdateServicePayload,
  ) {
    //get the technician profile
    const technician = await findApprovedTechnicianProfile(userId);

    //get the service
    const service = await this.findWritableService(serviceId);
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

  //-------------------------------------------
  //-------------Get Technician's Service-------------
  //-------------------------------------------
  async getMyServices(userId: string, query: TListManagedServicesQuery) {
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
      items: items.map(serviceTechnicianListMapper),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  //-------------------------------------------
  //-------------TECHNICIAN + ADMIN ACTIONS----------
  //--------------Delete Service (soft)-------------
  //-------------------------------------------
  async deleteService(userId: string, role: TRole, serviceId: string) {
    //Check the service
    const service = await this.findWritableService(serviceId);

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
    const activeBookingCount = await prisma.booking.count({
      where: { serviceId, status: { in: ACTIVE_BOOKING_STATUSES } },
    });

    // Removal writes deletedAt and deletedBy only. isActive is the technician's own pause switch and it keeps its value through the removal — writing over it destroys the answer to "was this service being offered before it went away", which is exactly what a restore needs to put it back the way it was found.
    const deletedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
      include: SERVICE_DELETED_INCLUDE,
    });

    const technicianName = createFullName(
      deletedService.technician.users.firstName,
      deletedService.technician.users.lastName,
    );

    //send notification
    await notifyServiceDeleted(
      deletedService.title,
      deletedService.technician.userId,
      technicianName,
      role === TRole.ADMIN,
    );
    const { technician, ...serviceFields } = deletedService;
    return { ...serviceFields, activeBookingCount };
  }

  //-------------------------------------------
  //--------------Restore a removed service-------------
  //-------------------------------------------
  async restoreService(userId: string, role: TRole, serviceId: string) {
    const service = await this.findWritableService(serviceId, {
      allowDeleted: true,
    });

    if (!service.deletedAt) {
      throw new AppError("This service is not removed.", httpStatus.CONFLICT);
    }

    if (role === TRole.TECHNICIAN) {
      const technician = await findTechnicianProfileByUserId(userId);

      if (service.technicianId !== technician.id) {
        throw new AppError(
          "You can only restore your own services.",
          httpStatus.FORBIDDEN,
        );
      }
      if (service.deletedBy !== userId) {
        throw new AppError(
          "An admin removed this service. Contact support to restore it.",
          httpStatus.FORBIDDEN,
        );
      }
    }

    // The category may have gone away while the service sat removed. Putting it back under a dead category would produce a row no list can reach.
    await this.isCategoryExist(service.categoryId);

    // Clears the removal and nothing else. Whatever isActive held before the removal is still sitting there, so a service that was paused comes back paused and a live one comes back live — turning it back on is the technician's own separate decision.
    const restoredService = await prisma.service.update({
      where: { id: serviceId },
      data: { deletedAt: null, deletedBy: null },
      include: SERVICE_DELETED_INCLUDE,
    });

    //send notification
    await notifyServiceRestored(
      restoredService.id,
      restoredService.title,
      restoredService.technician.userId,
      role === TRole.ADMIN,
    );

    const { technician, ...serviceFields } = restoredService;
    return serviceFields;
  }

  //-------------------------------------------
  //------------------ADMIN: service list + booking count-----------------
  //-------------------------------------------
  async getAllServicesForAdmin(query: TListManagedServicesQuery) {
    const { page, limit, skip } = getPagination(query.page, query.limit);
    const where = buildAdminServiceFilter(query);

    const [items, total] = await prisma.$transaction([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: ADMIN_SERVICE_LIST_INCLUDE,
      }),
      prisma.service.count({ where }),
    ]);

    return {
      items: items.map(serviceAdminListMapper),
      meta: { page, limit, total },
    };
  }

  //-------------------------------------------
  //------------------ADMIN: service detail + bookings by status-----------------
  //-------------------------------------------
  async getServiceByIdForAdmin(id: string) {
    const service = await prisma.service.findUnique({
      where: { id },
      include: SERVICE_DETAILS_INCLUDE,
    });
    if (!service)
      throw new AppError("Service not found.", httpStatus.NOT_FOUND);

    const bookingsByStatus = await getBookingStatusBreakdown({ serviceId: id });
    return { ...service, bookingsByStatus };
  }

  //-------------------------------------------
  //------------------PUBLIC-----------------
  //--------------Get All Service-------------
  //-------------------------------------------
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

    return {
      items: items.map(servicePublicListMapper),
      meta: { page, limit, total },
    };
  }
}

export const serviceService = new ServiceService();
