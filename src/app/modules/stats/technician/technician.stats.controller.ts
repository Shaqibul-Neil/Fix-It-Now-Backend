import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../../types/express.types";
import { asyncHandler } from "../../../../utils/asyncHandler";
import { sendResponse } from "../../../../utils/sendResponse";
import type { TStatsPeriodQuery } from "../stats.validation";
import {
  TechnicianStatsService,
  technicianStatsService,
} from "./technician.stats.service";

class TechnicianStatsController {
  constructor(private technicianStatsService: TechnicianStatsService) {}

  // ---------- Dashboard (stats + charts) ----------
  getTechnicianDashboard = asyncHandler(
    async (req: TRequest, res: TResponse) => {
      const userId = req.user.id as string;
      const query = req.query as TStatsPeriodQuery;
      const result = await this.technicianStatsService.getTechnicianDashboard(
        userId,
        query,
      );
      sendResponse({
        res,
        status: httpStatus.OK,
        success: true,
        message: "Technician dashboard fetched successfully",
        data: result,
      });
    },
  );

  // ---------- Recent job requests (table) ----------
  getTechnicianRecentRequests = asyncHandler(
    async (req: TRequest, res: TResponse) => {
      const userId = req.user.id as string;
      const result =
        await this.technicianStatsService.getTechnicianRecentRequests(userId);
      sendResponse({
        res,
        status: httpStatus.OK,
        success: true,
        message: "Recent job requests fetched successfully",
        data: result,
      });
    },
  );
}

export const technicianStatsController = new TechnicianStatsController(
  technicianStatsService,
);
