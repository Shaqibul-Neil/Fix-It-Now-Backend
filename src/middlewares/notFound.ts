import httpStatus from "http-status";
import type { TRequest, TResponse } from "../types/express.types";
import { sendResponse } from "../utils/sendResponse";
import { mountedPaths } from "../app/routes";

export const notFound = (req: TRequest, res: TResponse) => {
  sendResponse({
    res,
    status: httpStatus.NOT_FOUND,
    success: false,
    message: "API endpoint not found",
    data: { path: req.originalUrl, availableModules: mountedPaths },
  });
};
