import { prisma } from "../../src/lib/prisma";
import { TRole, TUserStatus } from "../../generated/prisma/enums";

export interface SeededAdmins {
  primaryId: string; // used as TechnicianProfile.reviewedBy on approve/reject
  ids: string[]; // every admin — they all receive the broadcast notifications
}

const adminSeed = [
  {
    firstName: "System",
    lastName: "Admin",
    email: "admin@fixitnow.com",
  },
  {
    firstName: "Moderation",
    lastName: "Desk",
    email: "moderator@fixitnow.com",
  },
];

export async function seedAdmins(passwordHash: string): Promise<SeededAdmins> {
  const ids: string[] = [];

  for (const a of adminSeed) {
    const user = await prisma.user.create({
      data: {
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        passwordHash,
        role: TRole.ADMIN,
        status: TUserStatus.ACTIVE,
        lastLoginAt: new Date(),
      },
    });
    ids.push(user.id);
  }

  const primaryId = ids[0];
  if (!primaryId) {
    throw new Error("Seed error: no admin was created");
  }

  return { primaryId, ids };
}
