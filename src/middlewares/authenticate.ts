import httpStatus from "http-status";
import type {
  TNextFunction,
  TRequest,
  TResponse,
} from "../types/express.types";
import { AppError } from "../utils/appError";
import { jwtToken } from "../utils/jwt";
import { asyncHandler } from "../utils/asyncHandler";
import { authService } from "../app/modules/auth/auth.service";
import { TUserStatus } from "../../generated/prisma/enums";

export const authenticate = asyncHandler(
  async (req: TRequest, res: TResponse, next: TNextFunction) => {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization?.split(" ")[1]
      : null;

    if (!token)
      throw new AppError(
        "You are not logged in. Please log in to access this resource.",
        httpStatus.UNAUTHORIZED,
      );

    //token verify
    const verifiedToken = jwtToken.verifyToken(token, "access");
    const userId = verifiedToken["id"] as string;
    if (!userId)
      throw new AppError(
        "Unauthorized - Token payload is malformed.",
        httpStatus.UNAUTHORIZED,
      );

    //check user status
    const user = await authService.currentUser(userId);
    if (user.status !== TUserStatus.ACTIVE)
      throw new AppError(
        "Unauthorized - Your account is no longer active.",
        httpStatus.UNAUTHORIZED,
      );

    req.user = user;
    next();
  },
);
