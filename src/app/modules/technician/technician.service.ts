import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import type {
  TAdminListTechniciansQuery,
  TCreateTechnicianProfilePayload,
  TListTechniciansQuery,
  TReviewTechnicianPayload,
  TUpdateTechnicianProfilePayload,
} from "./technician.validation";
import {
  buildAdminTechnicianFilter,
  buildTechnicianFilter,
} from "./technician.utils";
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
  notifyTechnicianApproved,
  notifyTechnicianOnboarded,
  notifyTechnicianProfileUpdated,
  notifyTechnicianRejected,
} from "../notification/notification.events";
import {
  ensureNoTechnicianProfile,
  findTechnicianProfileById,
  findTechnicianProfileByUserId,
} from "./technician.model";
import {
  technicianAdminListMapper,
  technicianDetailsMapper,
  technicianListMapper,
} from "./technician.mapper";
import { getBookingStatusBreakdown } from "../booking/booking.model";
import {
  TTechnicianApprovalStatus,
  TUserStatus,
} from "../../../../generated/prisma/enums";

export class TechnicianService {
  //-------------TECHNICIAN ACTIONS--------------
  //--------------Create / Onboard Profile-------------
  async createProfile(
    userId: string,
    payload: TCreateTechnicianProfilePayload,
  ) {
    const { basicInfo, pricing, location } = payload;

    await ensureNoTechnicianProfile(userId);

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
    const existing = await findTechnicianProfileByUserId(userId);
    const { basicInfo, pricing, location } = payload;

    //if no data is sent
    const data = {
      ...(basicInfo ?? {}),
      ...(pricing ?? {}),
      ...(location ?? {}),
    };
    ensureNotEmptyObject(data);

    // A rejected technician who fixes their profile goes back into the queue.
    const isReapplying =
      existing.approvalStatus === TTechnicianApprovalStatus.REJECTED;

    //update profile
    const profile = await prisma.technicianProfile.update({
      where: { userId },
      data: {
        ...data,
        ...(isReapplying && {
          approvalStatus: TTechnicianApprovalStatus.PENDING,
          rejectionReason: null,
          reviewedAt: null,
          reviewedBy: null,
        }),
      },
      include: TECHNICIAN_PROFILE_WITH_USER_INCLUDE,
    });

    const technicianName = createFullName(
      profile.users.firstName,
      profile.users.lastName,
    );

    // A re-apply is a new item in the admin's review queue, not a plain edit.
    if (isReapplying) {
      await notifyTechnicianOnboarded(userId, technicianName);
    } else {
      await notifyTechnicianProfileUpdated(userId, technicianName);
    }

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
    const technician = await prisma.technicianProfile.findFirst({
      where: {
        id,
        isProfileComplete: true,
        approvalStatus: TTechnicianApprovalStatus.APPROVED,
        users: { status: TUserStatus.ACTIVE },
      },
      select: TECHNICIAN_DETAILS_SELECT,
    });
    if (!technician) {
      throw new AppError("Technician not found.", httpStatus.NOT_FOUND);
    }
    return technicianDetailsMapper(technician);
  }

  //--------------ADMIN: technician list + completed jobs-------------
  async getAllTechniciansForAdmin(query: TAdminListTechniciansQuery) {
    const { page, limit, skip } = getPagination(query.page, query.limit);
    const where = buildAdminTechnicianFilter(query);

    const [items, total] = await prisma.$transaction([
      prisma.technicianProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          query.approvalStatus === TTechnicianApprovalStatus.PENDING
            ? { createdAt: "asc" }
            : { averageRating: "desc" },
        select: ADMIN_TECHNICIAN_LIST_SELECT,
      }),
      prisma.technicianProfile.count({ where }),
    ]);

    return {
      items: items.map(technicianAdminListMapper),
      meta: { page, limit, total },
    };
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

  //--------------ADMIN: approve or reject an onboarding-------------
  async reviewTechnician(
    adminId: string,
    technicianId: string,
    payload: TReviewTechnicianPayload,
  ) {
    const technician = await findTechnicianProfileById(technicianId);

    // Re-sending the same decision would fire a duplicate notification.
    if (technician.approvalStatus === payload.status) {
      throw new AppError(
        `This technician is already ${payload.status.toLowerCase()}.`,
        httpStatus.CONFLICT,
      );
    }

    const isApproving = payload.status === TTechnicianApprovalStatus.APPROVED;

    const profile = await prisma.technicianProfile.update({
      where: { id: technicianId },
      data: {
        approvalStatus: payload.status,
        rejectionReason: isApproving ? null : payload.rejectionReason,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
      include: TECHNICIAN_PROFILE_WITH_USER_INCLUDE,
    });

    //let the technician know either way
    if (isApproving) {
      await notifyTechnicianApproved(technician.userId);
    } else {
      await notifyTechnicianRejected(
        technician.userId,
        payload.rejectionReason ?? "No reason provided.",
      );
    }

    return profile;
  }
}

export const technicianService = new TechnicianService();
