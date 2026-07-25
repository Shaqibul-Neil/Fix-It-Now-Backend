import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";

// look up a technician profile
export const findTechnicianProfileByUserId = async (userId: string) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw new AppError(
      "Profile not found. Please complete your onboarding first.",
      httpStatus.NOT_FOUND,
    );
  }
  return profile;
};
