import httpStatus from "http-status";
import {
  Prisma,
  TBookingStatus,
  TRole,
} from "../../../../generated/prisma/client";
import type {
  TCreateBookingPayload,
  TListBookingsQuery,
  TUpdateBookingStatusPayload,
} from "./booking.validation";
import { findCustomerProfileByUserId } from "../customer/customer.utils";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import { getDayOfWeek, getTimeString } from "../../../utils/date";
import { CUSTOMER_CANCELABLE } from "./booking.constants";
import { getPagination } from "../../../utils/utils";
import { buildBookingFilter, getBookingInclude } from "./booking.utils";
import { BOOKING_LIST_SELECT } from "./booking.include";
import { findTechnicianProfileByUserId } from "../technician/technician.utils";
import { bookingListMapper } from "./booking.mapper";

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

  //Shared Booking List query
  private async bookingLists(
    baseWhere: Prisma.BookingWhereInput,
    query: TListBookingsQuery,
  ) {
    const { page, limit, skip } = getPagination(query.page, query.limit);

    const where = buildBookingFilter(baseWhere, query);

    const [items, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: BOOKING_LIST_SELECT,
      }),

      prisma.booking.count({ where }),
    ]);
    return {
      items: items.map(bookingListMapper),
      meta: {
        page,
        limit,
        total,
      },
    };
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

    // Prevent double-booking the same technician at the same time.
    const clashingBooking = await prisma.booking.findFirst({
      where: {
        technicianId: service.technicianId,
        scheduledAt: payload.scheduledAt,
        status: {
          in: [
            TBookingStatus.REQUESTED,
            TBookingStatus.ACCEPTED,
            TBookingStatus.PAID,
            TBookingStatus.IN_PROGRESS,
          ],
        },
      },
      select: { id: true },
    });

    if (clashingBooking) {
      throw new AppError(
        "Technician is already booked at the selected time.",
        httpStatus.CONFLICT,
      );
    }

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

  //--------------Cancel Booking-------------
  async cancelBooking(userId: string, bookingId: string) {
    //get the customer information
    const customer = await findCustomerProfileByUserId(userId);

    //get the booking and check conditions
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, customerId: true, status: true },
    });
    if (!booking) {
      throw new AppError("Booking not found.", httpStatus.NOT_FOUND);
    }
    if (booking.customerId !== customer.id) {
      throw new AppError(
        "You can only cancel your own bookings.",
        httpStatus.FORBIDDEN,
      );
    }
    if (!CUSTOMER_CANCELABLE.includes(booking.status)) {
      throw new AppError(
        `A booking in ${booking.status} status cannot be cancelled.`,
        httpStatus.BAD_REQUEST,
      );
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: TBookingStatus.CANCELLED,
        cancelledAt: new Date(),
        statusHistory: {
          create: {
            status: TBookingStatus.CANCELLED,
            changedById: userId,
          },
        },
      },
      include: { service: { select: { id: true, title: true } } },
    });
  }

  //-----------Get Customer's Bookings List-----------
  async getCustomerBookings(userId: string, query: TListBookingsQuery) {
    const customer = await findCustomerProfileByUserId(userId);
    return this.bookingLists({ customerId: customer.id }, query);
  }

  //-----------Booking Details-----------
  async getBookingDetails(userId: string, role: TRole, bookingId: string) {
    const include: Prisma.BookingInclude = getBookingInclude(role);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include,
    });

    if (!booking) {
      throw new AppError("Booking not found.", httpStatus.NOT_FOUND);
    }

    if (role === TRole.CUSTOMER) {
      const customer = await findCustomerProfileByUserId(userId);
      if (booking.customerId !== customer.id) {
        throw new AppError(
          "You don't have permission to view this booking.",
          httpStatus.FORBIDDEN,
        );
      }
    } else if (role === TRole.TECHNICIAN) {
      const technician = await findTechnicianProfileByUserId(userId);
      if (booking.technicianId !== technician.id) {
        throw new AppError(
          "You don't have permission to view this booking.",
          httpStatus.FORBIDDEN,
        );
      }
    }

    return booking;
  }

  //-------------TECHNICIAN ACTIONS----------
  //----------Get Technician's Bookings List---------
  async getTechnicianBookings(userId: string, query: TListBookingsQuery) {
    const technician = await findTechnicianProfileByUserId(userId);

    return this.bookingLists(
      {
        technicianId: technician.id,
      },
      query,
    );
  }

  //--------------Update Booking Status-------------
  async updateStatusByTechnician(
    userId: string,
    bookingId: string,
    payload: TUpdateBookingStatusPayload,
  ) {
    //get technician profile
    const technician = await findTechnicianProfileByUserId(userId);

    //get the booking and check conditions
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, technicianId: true, status: true },
    });
    if (!booking) {
      throw new AppError("Booking not found.", httpStatus.NOT_FOUND);
    }
    if (booking.technicianId !== technician.id) {
      throw new AppError(
        "You can only manage your own bookings.",
        httpStatus.FORBIDDEN,
      );
    }

    // Status transition validation
    const throwInvalidTransitionError = () => {
      throw new AppError(
        `Cannot change booking from ${booking.status} to ${payload.status}.`,
        httpStatus.BAD_REQUEST,
      );
    };
    // REQUESTED -> ACCEPTED | DECLINED
    if (booking.status === TBookingStatus.REQUESTED) {
      if (
        payload.status !== TBookingStatus.ACCEPTED &&
        payload.status !== TBookingStatus.DECLINED
      ) {
        throwInvalidTransitionError();
      }
    }
    // PAID -> IN_PROGRESS
    else if (booking.status === TBookingStatus.PAID) {
      if (payload.status !== TBookingStatus.IN_PROGRESS) {
        throwInvalidTransitionError();
      }
    }
    // IN_PROGRESS -> COMPLETED
    else if (booking.status === TBookingStatus.IN_PROGRESS) {
      if (payload.status !== TBookingStatus.COMPLETED) {
        throwInvalidTransitionError();
      }
    } else {
      throwInvalidTransitionError();
    }

    // Timestamp handling
    const timestamps: Prisma.BookingUpdateInput = {};
    if (payload.status === TBookingStatus.ACCEPTED) {
      timestamps.acceptedAt = new Date();
    }
    if (payload.status === TBookingStatus.COMPLETED) {
      timestamps.completedAt = new Date();
    }
    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: payload.status,
        ...timestamps,
        statusHistory: {
          create: {
            status: payload.status,
            note: payload.note,
            changedById: userId,
          },
        },
      },
      select: {
        id: true,
        status: true,
        acceptedAt: true,
        completedAt: true,
      },
    });
  }

  //-------------ADMIN ACTIONS----------
  //----------Get All Bookings List---------
  async getAllBookings(query: TListBookingsQuery) {
    return this.bookingLists({}, query);
  }
}
export const bookingService = new BookingService();
