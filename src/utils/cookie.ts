import config from "../config";
import type { TResponse } from "../types/express.types";

export const setRefreshTokenCookie = (res: TResponse, token: string) => {
  res.cookie("refreshToken", token, {
    sameSite: "none",
    httpOnly: true,
    secure: config.node_env === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};
