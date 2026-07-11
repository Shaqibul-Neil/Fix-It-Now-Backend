import type { Prisma } from "../../../../generated/prisma/client";

// technician lookup for availability
export const AVAILABILITY_TECHNICIAN_SELECT = {
  id: true,
  users: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
} as const satisfies Prisma.TechnicianProfileSelect;

// stored availability slot shape (list output)
export const AVAILABILITY_SLOT_SELECT = {
  id: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  isActive: true,
} as const satisfies Prisma.AvailabilitySlotSelect;
