import { prisma } from "../../src/lib/prisma";
import { TRole, TUserStatus } from "../../generated/prisma/enums";

export async function seedAdmin(passwordHash: string): Promise<void> {
  await prisma.user.create({
    data: {
      firstName: "System",
      lastName: "Admin",
      email: "admin@fixitnow.com",
      passwordHash,
      role: TRole.ADMIN,
      status: TUserStatus.ACTIVE,
    },
  });
}
