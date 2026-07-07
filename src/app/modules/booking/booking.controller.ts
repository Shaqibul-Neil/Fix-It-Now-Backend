import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import { bookingService, type BookingService } from "./booking.service";
import type {
  TCreateBookingPayload,
  TListBookingsQuery,
} from "./booking.validation";
import type { TRole } from "../../../../generated/prisma/enums";

class BookingController {
  constructor(private bookingService: BookingService) {}

  //-------------CUSTOMER ACTIONS----------
  //--------------Create Booking-------------
  createBooking = asyncHandler(async (req: TRequest, res: TResponse) => {
    const payload = req.body as TCreateBookingPayload;
    const booking = await this.bookingService.createBooking(
      req.user.id,
      payload,
    );

    sendResponse({
      res,
      status: httpStatus.CREATED,
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  });

  //--------------Cancel Booking-------------
  cancelBooking = asyncHandler(async (req: TRequest, res: TResponse) => {
    const bookingId = req.params.id as string;
    const booking = await this.bookingService.cancelBooking(
      req.user.id,
      bookingId,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  });

  //----------Get Customer's Booking List---------
  getCustomerBookingsList = asyncHandler(
    async (req: TRequest, res: TResponse) => {
      const userId = req.user.id as string;
      const query = req.query as TListBookingsQuery;
      const { items, meta } = await this.bookingService.getCustomerBookings(
        userId,
        query,
      );

      sendResponse({
        res,
        status: httpStatus.OK,
        success: true,
        message: "Bookings fetched successfully",
        data: items,
        meta,
      });
    },
  );

  getBookingDetails = asyncHandler(async (req: TRequest, res: TResponse) => {
    const bookingId = req.params.id as string;
    const userId = req.user.id as string;
    const role = req.user.role as TRole;

    const result = await this.bookingService.getBookingDetails(
      userId,
      role,
      bookingId,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Bookings details fetched successfully",
      data: result,
    });
  });

  //-------------TECHNICIAN ACTIONS----------
  //----------Get Technician's Booking List---------
  getTechnicianBookingsList = asyncHandler(
    async (req: TRequest, res: TResponse) => {
      const userId = req.user.id as string;
      const query = req.query as TListBookingsQuery;
      const { items, meta } = await this.bookingService.getTechnicianBookings(
        userId,
        query,
      );

      sendResponse({
        res,
        status: httpStatus.OK,
        success: true,
        message: "Bookings fetched successfully",
        data: items,
        meta,
      });
    },
  );

  //-------------ADMIN ACTIONS----------
  //----------Get All Bookings List---------
  getAllBookingsList = asyncHandler(async (req: TRequest, res: TResponse) => {
    const query = req.query as TListBookingsQuery;
    const { items, meta } = await this.bookingService.getAllBookings(query);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Bookings fetched successfully",
      data: items,
      meta,
    });
  });
}

export const bookingController = new BookingController(bookingService);
