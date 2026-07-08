import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import config from "../../../config";
import { paymentService, type PaymentService } from "./payment.service";
import type {
  TCreatePaymentPayload,
  TListPaymentsQuery,
} from "./payment.validation";

class PaymentController {
  constructor(private paymentService: PaymentService) {}
  //-------------CUSTOMER ACTIONS----------
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

  //--------------Gateway Success (public)-------------
  paymentSuccess = asyncHandler(async (req: TRequest, res: TResponse) => {
    const tranId = req.body.tran_id as string;
    const valId = req.body.val_id as string;
    const ok = await this.paymentService.handleSuccess(tranId, valId);
    return res.redirect(
      `${config.app_url}/payment/${ok ? "success" : "fail"}?tran_id=${tranId}`,
    );
  });

  //--------------Gateway Fail (public)-------------
  paymentFail = asyncHandler(async (req: TRequest, res: TResponse) => {
    const tranId = req.body.tran_id as string;
    await this.paymentService.handleFailure(tranId);
    return res.redirect(`${config.app_url}/payment/fail?tran_id=${tranId}`);
  });

  //--------------Gateway Cancel (public)-------------
  paymentCancel = asyncHandler(async (req: TRequest, res: TResponse) => {
    const tranId = req.body.tran_id as string;
    await this.paymentService.handleFailure(tranId);
    return res.redirect(`${config.app_url}/payment/cancel?tran_id=${tranId}`);
  });

  //--------------Customer payment history-------------
  getMyPayments = asyncHandler(async (req: TRequest, res: TResponse) => {
    const userId = req.user.id as string;
    const query = req.query as TListPaymentsQuery;
    const { items, meta } = await this.paymentService.getMyPaymentsList(
      userId,
      query,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Payments fetched successfully",
      data: items,
      meta,
    });
  });
  //--------------Payment details-------------

  //-------------ADMIN ACTIONS----------
  getAllPayments = asyncHandler(async (req: TRequest, res: TResponse) => {
    const query = req.query as TListPaymentsQuery;
    const { items, meta } = await this.paymentService.getAllPaymentLists(query);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Payments fetched successfully",
      data: items,
      meta,
    });
  });
}
export const paymentController = new PaymentController(paymentService);
