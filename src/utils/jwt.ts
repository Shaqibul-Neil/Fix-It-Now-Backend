import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import httpStatus from "http-status";
import config from "../config";
import { AppError } from "./appError";
import type { IJwtPayload } from "../app/modules/auth/auth.interface";

//Token Verification
const verifyToken = (token: string, type: "access" | "refresh") => {
  const secret =
    type === "access" ? config.jwt.access.secret : config.jwt.refresh.secret;

  try {
    const decode = jwt.verify(token, secret);
    return decode as IJwtPayload & JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(
        "Unauthorized - Your access token has expired. Please refresh your session.",
        httpStatus.UNAUTHORIZED,
      );
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(
        "Unauthorized - The provided token is malformed, corrupted, or invalid.",
        httpStatus.UNAUTHORIZED,
      );
    }

    throw new AppError(
      "Unauthorized - Authentication failed due to an invalid token.",
      httpStatus.UNAUTHORIZED,
    );
  }
};

//Token Generation
const signToken = (payload: IJwtPayload) => {
  const accessToken = jwt.sign(payload, config.jwt.access.secret, {
    expiresIn: config.jwt.access.expires_in as SignOptions["expiresIn"],
  });

  const refreshToken = jwt.sign(payload, config.jwt.refresh.secret, {
    expiresIn: config.jwt.refresh.expires_in as SignOptions["expiresIn"],
  });

  return {
    accessToken,
    refreshToken,
  };
};

//Creating jwt payload
const createJwtPayload = (user: IJwtPayload): IJwtPayload => ({
  id: user.id,
  email: user.email,
  role: user.role,
});

export const jwtToken = { verifyToken, signToken, createJwtPayload };
