import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../../types/express.types";
import { asyncHandler } from "../../../../utils/asyncHandler";
import { sendResponse } from "../../../../utils/sendResponse";
import { AdminStatsService, adminStatsService } from "./admin.stats.service";
import type { TStatsPeriodQuery } from "../stats.validation";

class AdminStatsController {
  constructor(private adminStatsService: AdminStatsService) {}
  // ---------- Dashboard overview  ----------
  getAdminDashboard = asyncHandler(async (req: TRequest, res: TResponse) => {
    const query = req.query as TStatsPeriodQuery;
    const result = await this.adminStatsService.getAdminDashboard(query);
    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Dashboard overview fetched successfully",
      data: result,
    });
  });
}

export const adminStatsController = new AdminStatsController(adminStatsService);
