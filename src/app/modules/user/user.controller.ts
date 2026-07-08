import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import { userService, type UserService } from "./user.service";
import type {
  TListUsersQuery,
  TUpdateUserStatusPayload,
} from "./user.validation";

class UserController {
  constructor(private userService: UserService) {}

  //--------------Get all users-------------
  getAllUsers = asyncHandler(async (req: TRequest, res: TResponse) => {
    const query = req.query as TListUsersQuery;
    const { items, meta } = await this.userService.getAllUsers(query);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Users fetched successfully",
      data: items,
      meta,
    });
  });

  //--------------Ban / Active a user-------------
  updateUserStatus = asyncHandler(async (req: TRequest, res: TResponse) => {
    const adminId = req.user.id as string;
    const userId = req.params.id as string;
    const payload = req.body as TUpdateUserStatusPayload;
    const result = await this.userService.updateUserStatus(
      adminId,
      userId,
      payload,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "User status updated successfully",
      data: result,
    });
  });
}

export const userController = new UserController(userService);
