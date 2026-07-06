import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import {
  technicianProfileService,
  type TechnicianProfileService,
} from "./technicianProfile.service";
import type {
  TCreateTechnicianProfilePayload,
  TUpdateTechnicianProfilePayload,
} from "./technicianProfile.validation";
import { sendResponse } from "../../../utils/sendResponse";

class TechnicianProfileController {
  constructor(private technicianService: TechnicianProfileService) {}

  //----------Create Profile (Onboarding)---------
  createProfile = asyncHandler(async (req: TRequest, res: TResponse) => {
    const payload = req.body as TCreateTechnicianProfilePayload;
    const profile = await this.technicianService.createProfile(
      req.user.id,
      payload,
    );

    sendResponse({
      res,
      status: httpStatus.CREATED,
      success: true,
      message: "Technician profile created successfully",
      data: profile,
    });
  });

  //----------Update Profile---------
  updateProfile = asyncHandler(async (req: TRequest, res: TResponse) => {
    const payload = req.body as TUpdateTechnicianProfilePayload;
    const profile = await this.technicianService.updateProfile(
      req.user.id,
      payload,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Technician profile updated successfully",
      data: profile,
    });
  });

  //----------Get My Profile---------
  getMyProfile = asyncHandler(async (req: TRequest, res: TResponse) => {
    const profile = await this.technicianService.getMyProfile(req.user.id);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Technician profile fetched successfully",
      data: profile,
    });
  });
}

export const technicianProfileController = new TechnicianProfileController(
  technicianProfileService,
);
