import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import {
  PRICE_BUCKET,
  TECHNICIAN_SORT,
  type TAdminListTechniciansQuery,
  type TCreateTechnicianProfilePayload,
  type TListTechniciansQuery,
  type TReviewTechnicianPayload,
  type TUpdateAvailabilityStatusPayload,
  type TUpdateFeaturedStatusPayload,
  type TUpdateTechnicianProfilePayload,
} from "./technician.validation";
import {
  buildAdminTechnicianFilter,
  buildAdminTechnicianOrderBy,
  buildTechnicianFilter,
  buildTechnicianOrderBy,
  tallyValues,
} from "./technician.utils";
import {
  createFullName,
  ensureNotEmptyObject,
  getPagination,
} from "../../../utils/utils";
import {
  ADMIN_TECHNICIAN_DETAILS_SELECT,
  ADMIN_TECHNICIAN_LIST_SELECT,
  PUBLIC_TECHNICIAN_WHERE,
  TECHNICIAN_AVAILABILITY_SELECT,
  TECHNICIAN_DETAILS_SELECT,
  TECHNICIAN_FEATURED_SELECT,
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
  technicianAdminDetailsMapper,
  technicianAdminListMapper,
  technicianDetailsMapper,
  technicianListMapper,
} from "./technician.mapper";
import { getBookingStatusBreakdown } from "../booking/booking.model";
import { TTechnicianApprovalStatus } from "../../../../generated/prisma/enums";
import { LIVE_ONLY } from "../../../utils/recordStatus";

export class TechnicianService {
  //-------------------------------------------
  //-------------TECHNICIAN ACTIONS--------------
  //--------------Create / Onboard Profile-------------
  //-------------------------------------------
  async createProfile(
    userId: string,
    payload: TCreateTechnicianProfilePayload,
  ) {
    const { basicInfo, identity, pricing, location, profileDetails } = payload;

    await ensureNoTechnicianProfile(userId);

    const duplicateNid = await prisma.technicianProfile.findUnique({
      where: { nationalId: identity.nationalId },
      select: { id: true },
    });

    if (duplicateNid) {
      throw new AppError(
        "This National ID is already registered to another technician.",
        httpStatus.CONFLICT,
      );
    }

    const profile = await prisma.technicianProfile.create({
      data: {
        userId,
        phone: basicInfo.phone,
        avatar: basicInfo.avatar,
        coverImage: basicInfo.coverImage,
        bio: basicInfo.bio,
        experienceYears: basicInfo.experienceYears,
        nationalId: identity.nationalId,
        nidDocument: identity.nidDocument,
        passportNumber: identity.passportNumber,
        dateOfBirth: identity.dateOfBirth,
        emergencyContactName: identity.emergencyContactName,
        emergencyContactPhone: identity.emergencyContactPhone,
        hourlyRate: pricing.hourlyRate,
        serviceRadius: pricing.serviceRadius,
        offersEmergencyService: pricing.offersEmergencyService,
        address: location.address,
        city: location.city,
        area: location.area,
        ...(profileDetails ?? {}),
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

  //-------------------------------------------
  //--------------Update Profile-------------
  //-------------------------------------------
  async updateProfile(
    userId: string,
    payload: TUpdateTechnicianProfilePayload,
  ) {
    const existing = await findTechnicianProfileByUserId(userId);
    const { basicInfo, identity, pricing, location, profileDetails } = payload;

    // Identity is the one group that stops being editable. An approved technician swapping their NID would keep a badge an admin gave to a different person.
    if (
      identity &&
      existing.approvalStatus === TTechnicianApprovalStatus.APPROVED
    ) {
      throw new AppError(
        "Identity details cannot be changed after approval. Contact support.",
        httpStatus.FORBIDDEN,
      );
    }

    //if no data is sent
    const data = {
      ...(basicInfo ?? {}),
      ...(identity ?? {}),
      ...(pricing ?? {}),
      ...(location ?? {}),
      ...(profileDetails ?? {}),
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

  //-------------------------------------------
  //--------------Toggle Availability-------------
  // The technician's own switch, separate from the weekly schedule they set in the availability module: that one says which hours they work, this one says whether they are working at all. Booking creation reads it, so flipping it off stops new bookings while leaving the profile, the services and the schedule exactly where they are.
  //-------------------------------------------
  async updateAvailabilityStatus(
    userId: string,
    payload: TUpdateAvailabilityStatusPayload,
  ) {
    // Throws a clean 404 when onboarding was never completed — a bare update
    // would fail on the missing row with a Prisma error instead.
    await findTechnicianProfileByUserId(userId);

    return prisma.technicianProfile.update({
      where: { userId },
      data: { isAvailable: payload.isAvailable },
      select: TECHNICIAN_AVAILABILITY_SELECT,
    });
  }

  //-------------------------------------------
  //--------------Get Own Profile-------------
  //-------------------------------------------
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

  //-------------------------------------------
  //-------------PUBLIC ACTIONS--------------
  //--------------Public: technician list-------------
  //-------------------------------------------
  async getAllTechnicians(query: TListTechniciansQuery) {
    const { page, limit, skip } = getPagination(query.page, query.limit);

    const where = buildTechnicianFilter(query);

    const [items, total] = await prisma.$transaction([
      prisma.technicianProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: buildTechnicianOrderBy(query.sort),
        select: TECHNICIAN_LIST_SELECT,
      }),
      prisma.technicianProfile.count({ where }),
    ]);

    return {
      items: items.map(technicianListMapper),
      meta: { page, limit, total },
    };
  }

  //-------------------------------------------
  //--------------Public: filter sidebar counts----------
  //-------------------------------------------
  async getFilterFacets() {
    const publicWhere = buildTechnicianFilter({});

    const categories = await prisma.category.findMany({
      where: LIVE_ONLY,
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
    // One count per category instead of a groupBy: groupBy would count services,
    // and a technician with three plumbing services is still one technician.
    const categoryCounts = await prisma.$transaction(
      categories.map((category) =>
        prisma.technicianProfile.count({
          where: {
            ...publicWhere,
            services: {
              some: {
                categoryId: category.id,
                isActive: true,
                deletedAt: null,
              },
            },
          },
        }),
      ),
    );

    const rows = await prisma.technicianProfile.findMany({
      where: publicWhere,
      select: { skills: true },
    });
    return {
      categories: categories.map((category, index) => ({
        ...category,
        count: categoryCounts[index] ?? 0,
      })),
      skills: tallyValues(rows.map((row) => row.skills)),
      priceBuckets: PRICE_BUCKET,
      sortOptions: TECHNICIAN_SORT,
    };
  }

  //-------------------------------------------
  //---------Public: technician profile + reviews-------------
  //-------------------------------------------
  async getTechnicianById(id: string) {
    const technician = await prisma.technicianProfile.findFirst({
      where: { id, ...PUBLIC_TECHNICIAN_WHERE },
      select: TECHNICIAN_DETAILS_SELECT,
    });
    if (!technician) {
      throw new AppError("Technician not found.", httpStatus.NOT_FOUND);
    }
    return technicianDetailsMapper(technician);
  }

  //-------------------------------------------
  //--------------ADMIN: technician list + completed jobs-------------
  //-------------------------------------------
  async getAllTechniciansForAdmin(query: TAdminListTechniciansQuery) {
    const { page, limit, skip } = getPagination(query.page, query.limit);
    const where = buildAdminTechnicianFilter(query);

    const [items, total] = await prisma.$transaction([
      prisma.technicianProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: buildAdminTechnicianOrderBy(query.approvalStatus),
        select: ADMIN_TECHNICIAN_LIST_SELECT,
      }),
      prisma.technicianProfile.count({ where }),
    ]);

    return {
      items: items.map(technicianAdminListMapper),
      meta: { page, limit, total },
    };
  }

  //-------------------------------------------
  //--------------ADMIN: technician detail + bookings by status-------------
  //-------------------------------------------
  async getTechnicianByIdForAdmin(id: string) {
    const technician = await prisma.technicianProfile.findUnique({
      where: { id },
      select: ADMIN_TECHNICIAN_DETAILS_SELECT,
    });
    if (!technician) {
      throw new AppError("Technician not found.", httpStatus.NOT_FOUND);
    }

    const bookingsByStatus = await getBookingStatusBreakdown({
      technicianId: id,
    });

    return { ...technicianAdminDetailsMapper(technician), bookingsByStatus };
  }

  //-------------------------------------------
  //--------------ADMIN: approve or reject an onboarding-------------
  //-------------------------------------------
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

    if (technician.approvalStatus === TTechnicianApprovalStatus.APPROVED) {
      throw new AppError(
        "This technician is already approved. To stop them taking work, ban the account from user management instead.",
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

  //-------------------------------------------
  //--------------ADMIN: promote / demote on the public list-------------
  //-------------------------------------------
  async updateFeaturedStatus(
    technicianId: string,
    payload: TUpdateFeaturedStatusPayload,
  ) {
    const technician = await findTechnicianProfileById(technicianId);

    // Featuring an unapproved technician would put a card on the home page for
    // someone the public list itself filters out.
    if (
      payload.isFeatured &&
      technician.approvalStatus !== TTechnicianApprovalStatus.APPROVED
    ) {
      throw new AppError(
        "Only an approved technician can be featured.",
        httpStatus.CONFLICT,
      );
    }
    return prisma.technicianProfile.update({
      where: { id: technicianId },
      data: { isFeatured: payload.isFeatured },
      select: TECHNICIAN_FEATURED_SELECT,
    });
  }
}

export const technicianService = new TechnicianService();
