import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import { TTechnicianApprovalStatus } from "../../../../generated/prisma/enums";

// look up a technician profile
export const findTechnicianProfileByUserId = async (userId: string) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
    select: { id: true, approvalStatus: true },
  });
  if (!profile) {
    throw new AppError(
      "Profile not found. Please complete your onboarding first.",
      httpStatus.NOT_FOUND,
    );
  }
  return profile;
};

// onboarding runs once — guard before create
export const ensureNoTechnicianProfile = async (userId: string) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (profile) {
    throw new AppError(
      "Your onboarding is already complete.",
      httpStatus.CONFLICT,
    );
  }
};

// Publishing work needs an approved profile — a finished form is not enough.
export const findApprovedTechnicianProfile = async (userId: string) => {
  const profile = await findTechnicianProfileByUserId(userId);

  if (profile.approvalStatus === TTechnicianApprovalStatus.PENDING) {
    throw new AppError(
      "Your profile is waiting for admin approval. You can add services once it is approved.",
      httpStatus.FORBIDDEN,
    );
  }

  if (profile.approvalStatus === TTechnicianApprovalStatus.REJECTED) {
    throw new AppError(
      "Your profile was rejected. Update your profile to send it for review again.",
      httpStatus.FORBIDDEN,
    );
  }

  return profile;
};

// admin review target — profile plus the owner it belongs to
export const findTechnicianProfileById = async (id: string) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { id },
    select: { id: true, userId: true, approvalStatus: true },
  });
  if (!profile) {
    throw new AppError("Technician not found.", httpStatus.NOT_FOUND);
  }
  return profile;
};
