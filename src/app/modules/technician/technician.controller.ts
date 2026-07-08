import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import {
  technicianService,
  type TechnicianService,
} from "./technician.service";
import type {
  TCreateTechnicianProfilePayload,
  TListTechniciansQuery,
  TUpdateTechnicianProfilePayload,
} from "./technician.validation";
import { sendResponse } from "../../../utils/sendResponse";

class TechnicianController {
  constructor(private technicianService: TechnicianService) {}

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

  //--------------Public: technician list-------------
  getAllTechnicians = asyncHandler(async (req: TRequest, res: TResponse) => {
    const query = req.query as TListTechniciansQuery;
    const { items, meta } =
      await this.technicianService.getAllTechnicians(query);
    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Technicians fetched successfully",
      data: items,
      meta,
    });
  });

  //--------------Public: technician profile-------------
  getTechnicianById = asyncHandler(async (req: TRequest, res: TResponse) => {
    const result = await this.technicianService.getTechnicianById(
      req.params.id as string,
    );
    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Technician fetched successfully",
      data: result,
    });
  });
}

export const technicianController = new TechnicianController(technicianService);
