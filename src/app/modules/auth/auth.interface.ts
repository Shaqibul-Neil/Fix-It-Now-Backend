import type { TRole, TUserStatus } from "../../../../generated/prisma/enums";

export interface IAuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: TRole;
  status: TUserStatus;
}

export interface ISafeUser extends IAuthUser {
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJwtPayload extends Omit<
  IAuthUser,
  "firstName" | "lastName" | "status"
> {}
