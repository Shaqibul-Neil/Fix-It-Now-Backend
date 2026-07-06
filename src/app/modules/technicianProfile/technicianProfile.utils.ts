import { prisma } from "../../../lib/prisma";

export const findTechnicianProfileByUserId = (userId: string) =>
  prisma.technicianProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
