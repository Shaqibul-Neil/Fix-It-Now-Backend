import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import { customerService, type CustomerService } from "./customer.service";
import type { TUpdateCustomerProfilePayload } from "./customer.validation";

class CustomerController {
  constructor(private customerService: CustomerService) {}

  //--------------Get Own Profile-------------
  getMyProfile = asyncHandler(async (req: TRequest, res: TResponse) => {
    const result = await this.customerService.getMyProfile(req.user.id);
    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Profile fetched successfully",
      data: result,
    });
  });

  //--------------Update Profile-------------
  updateProfile = asyncHandler(async (req: TRequest, res: TResponse) => {
    const payload = req.body as TUpdateCustomerProfilePayload;
    const result = await this.customerService.updateProfile(
      req.user.id,
      payload,
    );
    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Profile updated successfully",
      data: result,
    });
  });
}

export const customerController = new CustomerController(customerService);
