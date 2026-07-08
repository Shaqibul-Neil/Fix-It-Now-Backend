import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import type {
  TCreateTechnicianProfilePayload,
  TListTechniciansQuery,
  TUpdateTechnicianProfilePayload,
} from "./technician.validation";
import {
  buildTechnicianFilter,
  findTechnicianProfileByUserId,
} from "./technician.utils";
import { ensureNotEmptyObject, getPagination } from "../../../utils/utils";
import { TReviewStatus } from "../../../../generated/prisma/enums";
import type { Prisma } from "../../../../generated/prisma/client";
import {
  TECHNICIAN_DETAILS_SELECT,
  TECHNICIAN_LIST_SELECT,
} from "./technician.include";

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
    });
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
    });
    return profile;
  }

  //--------------Get Own Profile-------------
  async getMyProfile(userId: string) {
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId },
      include: {
        users: {
          select: {
            firstName: true,
            lastName: true,
            lastLoginAt: true,
            email: true,
          },
        },
      },
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
      items,
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
    return technician;
  }
}

export const technicianService = new TechnicianService();
