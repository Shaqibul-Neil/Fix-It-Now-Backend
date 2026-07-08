import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import { authService, type AuthService } from "./auth.service";
import type {
  TLoginUserPayload,
  TRegisterUserPayload,
} from "./auth.validation";
import { setRefreshTokenCookie } from "../../../utils/cookie";
import config from "../../../config";
import { AppError } from "../../../utils/appError";

class AuthController {
  constructor(private authService: AuthService) {}

  //----------Register---------
  register = asyncHandler(async (req: TRequest, res: TResponse) => {
    const payload = req.body as TRegisterUserPayload;
    const user = await this.authService.registerUser(payload);

    sendResponse({
      res,
      status: httpStatus.CREATED,
      success: true,
      message: "User registered successfully",
      data: user,
    });
  });

  //----------Login---------
  login = asyncHandler(async (req: TRequest, res: TResponse) => {
    const payload = req.body as TLoginUserPayload;
    const { safeUser, tokens } = await this.authService.loginUser(payload);

    const { accessToken, refreshToken } = tokens;

    //set refresh token in cookie
    setRefreshTokenCookie(res, refreshToken);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "User logged in successfully",
      data: {
        accessToken,
        tokenType: "Bearer",
        expiresIn: config.jwt.access.expires_in,
        user: safeUser,
      },
    });
  });

  //----------Refresh Token---------
  refreshToken = asyncHandler(async (req: TRequest, res: TResponse) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken)
      throw new AppError(
        "Unauthorized - Refresh token is missing from your request cookies.",
        httpStatus.UNAUTHORIZED,
      );

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshToken(refreshToken);

    //set token in cookie
    setRefreshTokenCookie(res, newRefreshToken);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Access token generated",
      data: { accessToken },
    });
  });

  //----------Current User (me)---------
  getMe = asyncHandler(async (req: TRequest, res: TResponse) => {
    const user = await this.authService.currentUser(req.user.id);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  });
}

export const authController = new AuthController(authService);
