import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";

export const findCustomerProfileByUserId = async (userId: string) => {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw new AppError("Customer profile not found.", httpStatus.NOT_FOUND);
  }
  return profile;
};
