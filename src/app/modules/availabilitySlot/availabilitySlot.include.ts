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

// the technician's own slots — `isActive` included because the off days are
// theirs to see and toggle
export const AVAILABILITY_SLOT_SELECT = {
  id: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  isActive: true,
} as const satisfies Prisma.AvailabilitySlotSelect;

// What a customer sees. `isActive` is left out on purpose: the public query
// already drops the switched-off days, so every slot returned here is bookable.
export const PUBLIC_AVAILABILITY_SELECT = {
  id: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
} as const satisfies Prisma.AvailabilitySlotSelect;

// Monday first, earliest slot first. TDayOfWeek is a native Postgres enum, so
// "asc" follows the order the enum is declared in — not the alphabet.
export const AVAILABILITY_ORDER_BY: Prisma.AvailabilitySlotOrderByWithRelationInput[] =
  [{ dayOfWeek: "asc" }, { startTime: "asc" }];
