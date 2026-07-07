import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import { bookingService, type BookingService } from "./booking.service";
import type { TCreateBookingPayload } from "./booking.validation";
import type { TRole } from "../../../../generated/prisma/enums";

class BookingController {
  constructor(private bookingService: BookingService) {}

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
}

export const bookingController = new BookingController(bookingService);
