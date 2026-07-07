import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";

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
