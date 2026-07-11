import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import type {
  TLoginUserPayload,
  TRegisterUserPayload,
} from "./auth.validation";
import config from "../../../config";
import { TRole, TUserStatus } from "../../../../generated/prisma/enums";
import { AppError } from "../../../utils/appError";
import { jwtToken } from "../../../utils/jwt";
import { createFullName } from "../../../utils/utils";
import { notifyUserRegistered } from "../notification/notification.events";
import { AUTH_CURRENT_USER_SELECT, AUTH_REFRESH_SELECT } from "./auth.include";

export class AuthService {
  //--------------Register-------------
  async registerUser(payload: TRegisterUserPayload) {
    const { firstName, lastName, email, password, role } = payload;

    const isUserExist = await prisma.user.findUnique({
      where: { email },
    });
    if (isUserExist) {
      throw new AppError("Email already registered", httpStatus.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(
      password,
      config.bcrypt_salt_rounds,
    );

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: role,
          status: TUserStatus.ACTIVE,
          firstName,
          lastName,
        },
        omit: {
          passwordHash: true,
        },
      });
      // Customer: create empty profile now
      // Technician: skip — profile is built during onboarding.
      if (role === TRole.CUSTOMER) {
        await tx.customerProfile.create({
          data: { userId: createdUser.id },
        });
      }

      return createdUser;
    });

    const { lastLoginAt, createdAt, updatedAt, ...authUser } = user;

    const fullName = createFullName(user.firstName, user.lastName);

    //sending notification to admin
    await notifyUserRegistered(user.id, fullName, user.role);

    return authUser;
  }

  //--------------Login-------------
  async loginUser(payload: TLoginUserPayload) {
    const { email, password } = payload;

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new AppError(
        "Login Failed - Invalid credentials.",
        httpStatus.UNAUTHORIZED,
      );
    }

    //check user status
    if (user.status !== TUserStatus.ACTIVE) {
      throw new AppError(
        user.status === TUserStatus.BANNED
          ? "Login Failed - Your account has been banned."
          : "Login Failed - Your account is not active.",
        httpStatus.FORBIDDEN,
      );
    }

    //match the password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(
        "Login Failed - Password is incorrect.",
        httpStatus.UNAUTHORIZED,
      );
    }

    //stamp last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    //creating jwt payload and tokens
    const jwtPayload = jwtToken.createJwtPayload(user);
    const tokens = jwtToken.signToken(jwtPayload);

    const { passwordHash, lastLoginAt, createdAt, updatedAt, ...safeUser } =
      user;

    return { safeUser, tokens };
  }

  //------------Refresh Token-------------
  async refreshToken(refreshToken: string) {
    const payload = jwtToken.verifyToken(refreshToken, "refresh");
    const user = await prisma.user.findFirstOrThrow({
      where: { id: payload.id },
      select: AUTH_REFRESH_SELECT,
    });

    //check user status
    if (user.status !== TUserStatus.ACTIVE)
      throw new AppError(
        "Login Failed - The requested user is banned.",
        httpStatus.FORBIDDEN,
      );

    //creating jwt payload & tokens
    const jwtPayload = jwtToken.createJwtPayload(user);
    const newTokens = jwtToken.signToken(jwtPayload);
    return newTokens;
  }

  //----------Current User--------
  async currentUser(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: AUTH_CURRENT_USER_SELECT,
    });
    return user;
  }
}

export const authService = new AuthService();
