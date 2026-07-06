import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import type {
  TCreateTechnicianProfilePayload,
  TUpdateTechnicianProfilePayload,
} from "./technicianProfile.validation";
import type { TechnicianProfile } from "../../../../generated/prisma/client";

export class TechnicianProfileService {
  //Returns technician profile by user id
  private async getProfile(userId: string) {
    return prisma.technicianProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
  }
  //--------------Create / Onboard Profile-------------
  async createProfile(
    userId: string,
    payload: TCreateTechnicianProfilePayload,
  ): Promise<TechnicianProfile> {
    const existingTechnician = await this.getProfile(userId);
    if (existingTechnician) {
      throw new AppError("Profile already exists.", httpStatus.CONFLICT);
    }
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
  ): Promise<TechnicianProfile> {
    const existingTechnician = await this.getProfile(userId);
    if (!existingTechnician) {
      throw new AppError(
        "Profile not found. Please complete your onboarding first.",
        httpStatus.NOT_FOUND,
      );
    }
    const { basicInfo, pricing, location } = payload;

    //if no data is sent
    const data = {
      ...(basicInfo ?? {}),
      ...(pricing ?? {}),
      ...(location ?? {}),
    };
    if (Object.keys(data).length === 0) {
      throw new AppError(
        "No fields provided to update.",
        httpStatus.BAD_REQUEST,
      );
    }

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
}

export const technicianProfileService = new TechnicianProfileService();
