import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import type { TDayOfWeek } from "../../../../generated/prisma/enums";
import type { TSetAvailabilityPayload } from "./availabilitySlot.validation";
import { findTechnicianProfileByUserId } from "../technician/technician.model";
import { createFullName } from "../../../utils/utils";
import { notifyAvailabilityUpdated } from "../notification/notification.events";
import {
  AVAILABILITY_ORDER_BY,
  AVAILABILITY_SLOT_SELECT,
  AVAILABILITY_TECHNICIAN_SELECT,
  PUBLIC_AVAILABILITY_SELECT,
} from "./availabilitySlot.include";
import { PUBLIC_TECHNICIAN_WHERE } from "../technician/technician.include";

export class AvailabilityService {
  // Prevent overlapping availability slots within the same day.
  private noSlotOverlap(slots: TSetAvailabilityPayload["slots"]): void {
    const byDay = new Map<TDayOfWeek, { start: string; end: string }[]>();

    // Group all slots by day for independent validation.
    for (const s of slots) {
      const arr = byDay.get(s.dayOfWeek) ?? [];
      arr.push({ start: s.startTime, end: s.endTime });
      byDay.set(s.dayOfWeek, arr);
    }

    // Validate each day's schedule separately.
    for (const [day, slots] of byDay) {
      slots.sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 1; i < slots.length; i++) {
        const previous = slots[i - 1]!;
        const current = slots[i]!;

        // If the current slot starts before the previous one ends,
        if (current.start < previous.end) {
          throw new AppError(
            `Overlapping availability slots on ${day}.`,
            httpStatus.BAD_REQUEST,
          );
        }
      }
    }
  }

  //Get All The Availability
  // Raw start/end rather than a "09:00 - 17:00" label: the PUT that writes these
  // takes the two fields separately, so the edit form has to read them back the
  // same way. Inactive days are kept — they are the technician's own.
  private async getAvailabilityByTechnicianId(technicianId: string) {
    return prisma.availabilitySlot.findMany({
      where: { technicianId },
      orderBy: AVAILABILITY_ORDER_BY,
      select: AVAILABILITY_SLOT_SELECT,
    });
  }

  //--------------Set / Replace availability
  async setAvailability(userId: string, payload: TSetAvailabilityPayload) {
    //get technician
    const technician = await prisma.technicianProfile.findUnique({
      where: { userId },
      select: AVAILABILITY_TECHNICIAN_SELECT,
    });
    if (!technician) {
      throw new AppError(
        "Profile not found. Please complete your onboarding first.",
        httpStatus.NOT_FOUND,
      );
    }

    //check overlapping
    this.noSlotOverlap(payload.slots);
    const data = payload.slots.map((slot) => ({
      technicianId: technician.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: slot.isActive,
    }));

    await prisma.$transaction([
      prisma.availabilitySlot.deleteMany({
        where: { technicianId: technician.id },
      }),
      prisma.availabilitySlot.createMany({ data }),
    ]);

    const technicianName = createFullName(
      technician.users.firstName,
      technician.users.lastName,
    );

    //sending notification to admin
    await notifyAvailabilityUpdated(userId, technicianName);

    return this.getAvailabilityByTechnicianId(technician.id);
  }

  //--------------Get own availability-------------
  async getMyAvailability(userId: string) {
    const technician = await findTechnicianProfileByUserId(userId);
    return this.getAvailabilityByTechnicianId(technician.id);
  }

  //--------------Public: one technician's bookable hours-------------
  async getPublicAvailability(technicianId: string) {
    // Read through the profile instead of straight at the slot table. A pending,
    // rejected or banned technician answers 404 on their profile, and their
    // working hours have to be exactly as invisible.
    const technician = await prisma.technicianProfile.findFirst({
      where: { id: technicianId, ...PUBLIC_TECHNICIAN_WHERE },
      select: {
        availabilitySlots: {
          where: { isActive: true },
          orderBy: AVAILABILITY_ORDER_BY,
          select: PUBLIC_AVAILABILITY_SELECT,
        },
      },
    });

    if (!technician) {
      throw new AppError("Technician not found.", httpStatus.NOT_FOUND);
    }

    // An empty list is a real answer, not a miss: the booking check skips a
    // technician who published no hours, so the caller falls back to an open
    // time picker rather than showing nothing.
    return technician.availabilitySlots;
  }
}

export const availabilityService = new AvailabilityService();
