import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import config from "../../../config";
import { paymentService, type PaymentService } from "./payment.service";
import type { TCreatePaymentPayload } from "./payment.validation";

class PaymentController {
  constructor(private paymentService: PaymentService) {}

  //--------------Create Payment-------------
  createPayment = asyncHandler(async (req: TRequest, res: TResponse) => {
    const { bookingId } = req.body as TCreatePaymentPayload;
    const result = await this.paymentService.createPayment(
      req.user.id,
      bookingId,
    );

    sendResponse({
      res,
      status: httpStatus.CREATED,
      success: true,
      message: "Payment session created successfully",
      data: result,
    });
  });
}
export const paymentController = new PaymentController(paymentService);
