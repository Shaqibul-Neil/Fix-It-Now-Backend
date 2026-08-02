import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import { createFullName, getPagination } from "../../../utils/utils";
import {
  Prisma,
  TRole,
  TUserStatus,
} from "../../../../generated/prisma/client";
import type {
  TListUsersQuery,
  TUpdateUserStatusPayload,
} from "./user.validation";
import { buildUserFilter } from "./user.utils";
import {
  ADMIN_USER_LIST_SELECT,
  USER_SELECT,
  USER_STATUS_SELECT,
} from "./user.include";
import { notifyAccountAccessChanged } from "../notification/notification.events";

export class UserService {
  //--------------Account actions share one guard-------------
  private async findManageableUser(adminId: string, userId: string) {
    // Admin cannot act on self
    if (adminId === userId) {
      throw new AppError(
        "You cannot change your own account.",
        httpStatus.BAD_REQUEST,
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_STATUS_SELECT,
    });

    if (!user) {
      throw new AppError("User not found.", httpStatus.NOT_FOUND);
    }
    if (user.role === TRole.ADMIN) {
      throw new AppError(
        "Admin accounts cannot be managed here.",
        httpStatus.FORBIDDEN,
      );
    }

    return user;
  }

  //-------------------------------------------
  //-------------ADMIN ACTIONS----------
  //--------------Get all users-------------
  //-------------------------------------------
  async getAllUsers(query: TListUsersQuery) {
    const { page, limit, skip } = getPagination(query.page, query.limit);

    const where: Prisma.UserWhereInput = buildUserFilter(query);
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: ADMIN_USER_LIST_SELECT,
      }),
      prisma.user.count({ where }),
    ]);

    const data = items.map(
      ({ customerProfile, technicianProfile, ...rest }) => ({
        ...rest,
        avatar: customerProfile?.avatar ?? technicianProfile?.avatar ?? null,
        totalBookings: customerProfile?._count.bookings ?? 0,
        isDeleted: Boolean(rest.deletedAt),
      }),
    );

    return { items: data, meta: { page, limit, total } };
  }

  //-------------------------------------------
  //-------------ADMIN ACTIONS----------
  //--------------Ban / Reactive a user-------------
  //-------------------------------------------
  async updateUserStatus(
    adminId: string,
    userId: string,
    payload: TUpdateUserStatusPayload,
  ) {
    const user = await this.findManageableUser(adminId, userId);

    if (user.deletedAt) {
      throw new AppError(
        "This account is removed. Restore it before changing its status.",
        httpStatus.CONFLICT,
      );
    }
    if (user.status === payload.status) {
      throw new AppError(
        `User is already ${payload.status}.`,
        httpStatus.BAD_REQUEST,
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: payload.status },
      select: USER_SELECT,
    });

    //send notification
    await notifyAccountAccessChanged(
      userId,
      createFullName(user.firstName, user.lastName),
      payload.status === TUserStatus.ACTIVE,
    );

    return updatedUser;
  }

  //--------------Remove a user (soft)-------------
  async deleteUser(adminId: string, userId: string) {
    const user = await this.findManageableUser(adminId, userId);

    if (user.deletedAt) {
      throw new AppError(
        "This account is already removed.",
        httpStatus.CONFLICT,
      );
    }
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
      select: { ...USER_SELECT, deletedAt: true },
    });

    //send notification
    await notifyAccountAccessChanged(
      userId,
      createFullName(user.firstName, user.lastName),
      false,
    );

    return deletedUser;
  }

  //--------------Restore a user-------------
  // The account comes back exactly as it was left. A user who was banned before being removed is still banned after the restore — lifting that ban is a separate decision, taken on the status endpoint.
  async restoreUser(adminId: string, userId: string) {
    const user = await this.findManageableUser(adminId, userId);

    if (!user.deletedAt) {
      throw new AppError("This account is not removed.", httpStatus.CONFLICT);
    }

    const restoredUser = await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
      select: USER_SELECT,
    });

    // Only a restore that also leaves them able to sign in is news they can  read. If the old ban is still standing, the door is still shut.
    await notifyAccountAccessChanged(
      userId,
      createFullName(user.firstName, user.lastName),
      restoredUser.status === TUserStatus.ACTIVE,
    );

    return restoredUser;
  }
}

export const userService = new UserService();
