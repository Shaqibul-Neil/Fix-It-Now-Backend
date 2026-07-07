import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import type { TDayOfWeek } from "../../../../generated/prisma/enums";
import type { TSetAvailabilityPayload } from "./availabilitySlot.validation";
import { findTechnicianProfileByUserId } from "../technicianProfile/technicianProfile.utils";

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
  private async getAvailabilityByTechnicianId(technicianId: string) {
    const slots = await prisma.availabilitySlot.findMany({
      where: { technicianId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isActive: true,
      },
    });
    return slots.map((slot) => ({
      id: slot.id,
      day: slot.dayOfWeek,
      time: `${slot.startTime} - ${slot.endTime}`,
    }));
  }

  //--------------Set / Replace availability
  async setAvailability(userId: string, payload: TSetAvailabilityPayload) {
    const technician = await findTechnicianProfileByUserId(userId);
    //check overlapping
    this.noSlotOverlap(payload.slots);
    const data = payload.slots.map((slot) => ({
      technicianId: technician.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));

    await prisma.$transaction([
      prisma.availabilitySlot.deleteMany({
        where: { technicianId: technician.id },
      }),
      prisma.availabilitySlot.createMany({ data }),
    ]);

    return this.getAvailabilityByTechnicianId(technician.id);
  }

  //--------------Get own availability-------------
  async getMyAvailability(userId: string) {
    const technician = await findTechnicianProfileByUserId(userId);
    return this.getAvailabilityByTechnicianId(technician.id);
  }
}

export const availabilityService = new AvailabilityService();
