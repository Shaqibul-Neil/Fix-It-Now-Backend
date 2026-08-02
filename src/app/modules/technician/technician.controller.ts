import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import {
  technicianService,
  type TechnicianService,
} from "./technician.service";
import type {
  TAdminListTechniciansQuery,
  TCreateTechnicianProfilePayload,
  TListTechniciansQuery,
  TReviewTechnicianPayload,
  TUpdateAvailabilityStatusPayload,
  TUpdateFeaturedStatusPayload,
  TUpdateTechnicianProfilePayload,
} from "./technician.validation";
import { sendResponse } from "../../../utils/sendResponse";
import { TTechnicianApprovalStatus } from "../../../../generated/prisma/enums";

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

  //----------Toggle Availability---------
  updateAvailabilityStatus = asyncHandler(
    async (req: TRequest, res: TResponse) => {
      const payload = req.body as TUpdateAvailabilityStatusPayload;
      const profile = await this.technicianService.updateAvailabilityStatus(
        req.user.id,
        payload,
      );

      sendResponse({
        res,
        status: httpStatus.OK,
        success: true,
        message: payload.isAvailable
          ? "You are now accepting bookings"
          : "You are no longer accepting bookings",
        data: profile,
      });
    },
  );

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

  //--------------Public: filter sidebar counts-------------
  getFilterFacets = asyncHandler(async (_req: TRequest, res: TResponse) => {
    const facets = await this.technicianService.getFilterFacets();
    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Filter options fetched successfully",
      data: facets,
    });
  });

  //--------------Admin: technician list-------------
  getAllTechniciansForAdmin = asyncHandler(
    async (req: TRequest, res: TResponse) => {
      const query = req.query as TAdminListTechniciansQuery;
      const { items, meta } =
        await this.technicianService.getAllTechniciansForAdmin(query);
      sendResponse({
        res,
        status: httpStatus.OK,
        success: true,
        message: "Technicians fetched successfully",
        data: items,
        meta,
      });
    },
  );

  //--------------Admin: technician detail-------------
  getTechnicianByIdForAdmin = asyncHandler(
    async (req: TRequest, res: TResponse) => {
      const result = await this.technicianService.getTechnicianByIdForAdmin(
        req.params.id as string,
      );
      sendResponse({
        res,
        status: httpStatus.OK,
        success: true,
        message: "Technician details fetched successfully",
        data: result,
      });
    },
  );

  //--------------Admin: approve / reject technician-------------
  reviewTechnician = asyncHandler(async (req: TRequest, res: TResponse) => {
    const payload = req.body as TReviewTechnicianPayload;
    const profile = await this.technicianService.reviewTechnician(
      req.user.id,
      req.params.id as string,
      payload,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message:
        payload.status === TTechnicianApprovalStatus.APPROVED
          ? "Technician approved successfully"
          : "Technician rejected successfully",
      data: profile,
    });
  });

  //--------------Admin: promote / demote on the public list-------------
  updateFeaturedStatus = asyncHandler(async (req: TRequest, res: TResponse) => {
    const payload = req.body as TUpdateFeaturedStatusPayload;
    const profile = await this.technicianService.updateFeaturedStatus(
      req.params.id as string,
      payload,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: payload.isFeatured
        ? "Technician is now featured"
        : "Technician removed from featured",
      data: profile,
    });
  });
}

export const technicianController = new TechnicianController(technicianService);
