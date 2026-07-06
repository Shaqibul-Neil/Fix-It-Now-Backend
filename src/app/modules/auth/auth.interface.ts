import type { TRole, TUserStatus } from "../../../../generated/prisma/enums";

export interface ISafeUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: TRole;
  status: TUserStatus;
}

export interface IAuthUser extends ISafeUser {
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
}

export interface IJwtPayload extends Omit<
  ISafeUser,
  "firstName" | "lastName" | "status"
> {}
