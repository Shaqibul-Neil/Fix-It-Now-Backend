import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../../types/express.types";
import { asyncHandler } from "../../../../utils/asyncHandler";
import { sendResponse } from "../../../../utils/sendResponse";
import {
  CustomerStatsService,
  customerStatsService,
} from "./customer.stats.service";

class CustomerStatsController {
  constructor(private customerStatsService: CustomerStatsService) {}

  getCustomerDashboard = asyncHandler(async (req: TRequest, res: TResponse) => {
    const userId = req.user.id as string;
    const result = await this.customerStatsService.getCustomerDashboard(userId);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Customer dashboard fetched successfully",
      data: result,
    });
  });
}

export const customerStatsController = new CustomerStatsController(
  customerStatsService,
);
