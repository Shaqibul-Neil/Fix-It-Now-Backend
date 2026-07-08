import httpStatus from "http-status";
import type {
  TNextFunction,
  TRequest,
  TResponse,
} from "../types/express.types";
import type { TUserRoles } from "../types/types";
import { AppError } from "../utils/appError";

export const authorize = (...roles: TUserRoles[]) => {
  return (req: TRequest, res: TResponse, next: TNextFunction) => {
    if (!roles.length)
      throw new AppError(
        "Server Misconfiguration - No roles specified for this route.",
        httpStatus.INTERNAL_SERVER_ERROR,
      );
    try {
      if (!roles.includes(req.user.role))
        throw new AppError(
          `Forbidden Access - Access denied. This Role lacks necessary privileges.`,
          httpStatus.FORBIDDEN,
        );
      next();
    } catch (error) {
      next(error);
    }
  };
};
