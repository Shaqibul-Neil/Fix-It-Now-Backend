import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import type {
  TCreateTechnicianProfilePayload,
  TListTechniciansQuery,
  TUpdateTechnicianProfilePayload,
} from "./technician.validation";
import { buildTechnicianFilter } from "./technician.utils";
import {
  createFullName,
  ensureNotEmptyObject,
  getPagination,
} from "../../../utils/utils";
import {
  ADMIN_TECHNICIAN_LIST_SELECT,
  TECHNICIAN_DETAILS_SELECT,
  TECHNICIAN_LIST_SELECT,
  TECHNICIAN_MY_PROFILE_INCLUDE,
  TECHNICIAN_PROFILE_WITH_USER_INCLUDE,
} from "./technician.include";
import {
  notifyTechnicianOnboarded,
  notifyTechnicianProfileUpdated,
} from "../notification/notification.events";
import { findTechnicianProfileByUserId } from "./technician.model";
import {
  technicianDetailsMapper,
  technicianListMapper,
} from "./technician.mapper";
import { getBookingStatusBreakdown } from "../booking/booking.model";

export class TechnicianService {
  //-------------TECHNICIAN ACTIONS--------------
  //--------------Create / Onboard Profile-------------
  async createProfile(
    userId: string,
    payload: TCreateTechnicianProfilePayload,
  ) {
    const { basicInfo, pricing, location } = payload;
    const profile = await prisma.technicianProfile.create({
      data: {
        userId,
        phone: basicInfo.phone,
        avatar: basicInfo.avatar,
        bio: basicInfo.bio,
        experienceYears: basicInfo.experienceYears,
        hourlyRate: pricing.hourlyRate,
        serviceRadius: pricing.serviceRadius,
        address: location.address,
        city: location.city,
        area: location.area,
        isProfileComplete: true,
      },
      include: TECHNICIAN_PROFILE_WITH_USER_INCLUDE,
    });

    const technicianName = createFullName(
      profile.users.firstName,
      profile.users.lastName,
    );

    //sending notification to admin
    await notifyTechnicianOnboarded(userId, technicianName);
    return profile;
  }

  //--------------Update Profile-------------
  async updateProfile(
    userId: string,
    payload: TUpdateTechnicianProfilePayload,
  ) {
    await findTechnicianProfileByUserId(userId);
    const { basicInfo, pricing, location } = payload;

    //if no data is sent
    const data = {
      ...(basicInfo ?? {}),
      ...(pricing ?? {}),
      ...(location ?? {}),
    };
    ensureNotEmptyObject(data);

    //update profile
    const profile = await prisma.technicianProfile.update({
      where: { userId },
      data,
      include: TECHNICIAN_PROFILE_WITH_USER_INCLUDE,
    });

    const technicianName = createFullName(
      profile.users.firstName,
      profile.users.lastName,
    );

    //send admin notifications
    await notifyTechnicianProfileUpdated(userId, technicianName);

    return profile;
  }

  //--------------Get Own Profile-------------
  async getMyProfile(userId: string) {
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId },
      include: TECHNICIAN_MY_PROFILE_INCLUDE,
    });
    if (!profile) {
      throw new AppError(
        "Profile not found. Please complete your onboarding first.",
        httpStatus.NOT_FOUND,
      );
    }
    return profile;
  }

  //-------------PUBLIC ACTIONS--------------
  //--------------Public: technician list-------------
  async getAllTechnicians(query: TListTechniciansQuery) {
    const { page, limit, skip } = getPagination(query.page, query.limit);

    const where = buildTechnicianFilter(query);

    const [items, total] = await prisma.$transaction([
      prisma.technicianProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          averageRating: "desc",
        },
        select: TECHNICIAN_LIST_SELECT,
      }),
      prisma.technicianProfile.count({ where }),
    ]);

    return {
      items: items.map(technicianListMapper),
      meta: { page, limit, total },
    };
  }

  //---------Public: technician profile + reviews-------------
  async getTechnicianById(id: string) {
    const technician = await prisma.technicianProfile.findUnique({
      where: { id },
      select: TECHNICIAN_DETAILS_SELECT,
    });
    if (!technician) {
      throw new AppError("Technician not found.", httpStatus.NOT_FOUND);
    }
    return technicianDetailsMapper(technician);
  }

  //--------------ADMIN: technician list + completed jobs-------------
  async getAllTechniciansForAdmin(query: TListTechniciansQuery) {
    const { page, limit, skip } = getPagination(query.page, query.limit);
    const where = buildTechnicianFilter(query);

    const [items, total] = await prisma.$transaction([
      prisma.technicianProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { averageRating: "desc" },
        select: ADMIN_TECHNICIAN_LIST_SELECT,
      }),
      prisma.technicianProfile.count({ where }),
    ]);

    const data = items.map(({ _count, ...rest }) => ({
      ...technicianListMapper(rest),
      completedJobs: _count.bookings,
    }));

    return { items: data, meta: { page, limit, total } };
  }

  //--------------ADMIN: technician detail + bookings by status-------------
  async getTechnicianByIdForAdmin(id: string) {
    const technician = await prisma.technicianProfile.findUnique({
      where: { id },
      select: TECHNICIAN_DETAILS_SELECT,
    });
    if (!technician) {
      throw new AppError("Technician not found.", httpStatus.NOT_FOUND);
    }

    const bookingsByStatus = await getBookingStatusBreakdown({
      technicianId: id,
    });

    return { ...technicianDetailsMapper(technician), bookingsByStatus };
  }
}

export const technicianService = new TechnicianService();
