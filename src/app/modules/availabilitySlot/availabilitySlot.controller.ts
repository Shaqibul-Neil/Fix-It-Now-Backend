import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import {
  availabilityService,
  type AvailabilityService,
} from "./availabilitySlot.service";
import type { TSetAvailabilityPayload } from "./availabilitySlot.validation";

class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  //--------------Set / Replace availability-------------
  setMyAvailability = asyncHandler(async (req: TRequest, res: TResponse) => {
    const userId = req.user.id as string;
    const payload = req.body as TSetAvailabilityPayload;
    const slots = await this.availabilityService.setAvailability(
      userId,
      payload,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Availability updated successfully",
      data: slots,
    });
  });

  //--------------Get own availability-------------
  getMyAvailability = asyncHandler(async (req: TRequest, res: TResponse) => {
    const userId = req.user.id as string;
    const slots = await this.availabilityService.getMyAvailability(userId);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Availability fetched successfully",
      data: slots,
    });
  });
}
export const availabilityController = new AvailabilityController(
  availabilityService,
);
