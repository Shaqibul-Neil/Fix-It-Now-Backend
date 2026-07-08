import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import { getPagination } from "../../../utils/utils";
import { Prisma, TRole } from "../../../../generated/prisma/client";
import type {
  TListUsersQuery,
  TUpdateUserStatusPayload,
} from "./user.validation";
import { buildUserFilter } from "./user.utils";
import { USER_SELECT } from "./user.include";

export class UserService {
  //-------------ADMIN ACTIONS----------
  //--------------Get all users-------------
  async getAllUsers(query: TListUsersQuery) {
    const { page, limit, skip } = getPagination(query.page, query.limit);

    const where: Prisma.UserWhereInput = buildUserFilter(query);
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: USER_SELECT,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  //-------------ADMIN ACTIONS----------
  //--------------Ban / Active a user-------------
  async updateUserStatus(
    adminId: string,
    userId: string,
    payload: TUpdateUserStatusPayload,
  ) {
    // Admin cannot ban self
    if (adminId === userId) {
      throw new AppError(
        "You cannot change your own account status.",
        httpStatus.BAD_REQUEST,
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!user) {
      throw new AppError("User not found.", httpStatus.NOT_FOUND);
    }

    if (user.role === TRole.ADMIN) {
      throw new AppError(
        "Admin accounts cannot be banned.",
        httpStatus.FORBIDDEN,
      );
    }

    if (user.status === payload.status) {
      throw new AppError(
        `User is already ${payload.status}.`,
        httpStatus.BAD_REQUEST,
      );
    }

    return prisma.user.update({
      where: { id: userId },
      data: { status: payload.status },
      select: USER_SELECT,
    });
  }
}

export const userService = new UserService();
