import { prisma } from "../../../lib/prisma";

export const findTechnicianProfileIdByUser = (userId: string) =>
  prisma.technicianProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
