import httpStatus from "http-status";
import { Prisma, TBookingStatus } from "../../../../generated/prisma/client";
import type { TCreateBookingPayload } from "./booking.validation";
import { findCustomerProfileByUserId } from "../customer/customer.utils";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import { getDayOfWeek, getTimeString } from "../../../utils/date";

export class BookingService {
  //Check if the technician is available
  private async technicianAvailability(
    technicianId: string,
    scheduledAt: Date,
  ): Promise<void> {
    // Get all active availability slots of this technician
    const availabilitySlots = await prisma.availabilitySlot.findMany({
      where: { technicianId, isActive: true },
      select: { dayOfWeek: true, startTime: true, endTime: true },
    });
    // If technician has not configured availability
    if (availabilitySlots.length === 0) return;
    // Convert booking date into day & time
    const bookingDay = getDayOfWeek(scheduledAt);
    const bookingTime = getTimeString(scheduledAt);

    // Check whether the booking falls inside any available slot
    const isAvailable = availabilitySlots.some((slot) => {
      const isSameDay = slot.dayOfWeek === bookingDay;
      const startsAfterSlotBegins = bookingTime >= slot.startTime;
      const endsBeforeSlotEnds = bookingTime < slot.endTime;
      const isWithinTime =
        isSameDay && startsAfterSlotBegins && endsBeforeSlotEnds;
      return isWithinTime;
    });
    if (!isAvailable) {
      throw new AppError(
        "Technician is not available at the selected time.",
        httpStatus.BAD_REQUEST,
      );
    }
  }

  //-------------CUSTOMER ACTIONS----------
  //--------------Create Booking-------------
  async createBooking(userId: string, payload: TCreateBookingPayload) {
    //get the customer information
    const customer = await findCustomerProfileByUserId(userId);

    //check for service
    const service = await prisma.service.findUnique({
      where: { id: payload.serviceId },
      select: {
        id: true,
        isActive: true,
        price: true,
        technicianId: true,
      },
    });
    if (!service) {
      throw new AppError("Service not found.", httpStatus.NOT_FOUND);
    }
    if (!service.isActive) {
      throw new AppError("This service is not active.", httpStatus.BAD_REQUEST);
    }

    //check if the technician is available
    await this.technicianAvailability(
      service.technicianId,
      payload.scheduledAt,
    );

    //create booking
    return prisma.booking.create({
      data: {
        customerId: customer.id,
        technicianId: service.technicianId,
        serviceId: service.id,
        amount: service.price,
        address: payload.address,
        city: payload.city,
        area: payload.area,
        notes: payload.notes,
        scheduledAt: payload.scheduledAt,
        statusHistory: {
          create: {
            status: TBookingStatus.REQUESTED,
            changedById: userId,
          },
        },
      },
      include: {
        service: {
          select: { id: true, title: true, price: true },
        },
      },
    });
  }

  //--------------Get Own Bookings-------------
}
export const bookingService = new BookingService();
