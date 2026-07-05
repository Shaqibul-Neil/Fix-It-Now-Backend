import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { authService, type AuthService } from "./auth.service";

class AuthController {
  constructor(private authService: AuthService) {}

  //Register new user
  register = asyncHandler(async (req: TRequest, res: TResponse) => {});
}

export const authController = new AuthController(authService);
