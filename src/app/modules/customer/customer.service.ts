import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import { ensureNotEmptyObject } from "../../../utils/utils";
import { findCustomerProfileByUserId } from "./customer.utils";
import type { TUpdateCustomerProfilePayload } from "./customer.validation";
import { CUSTOMER_PROFILE_SELECT } from "./customer.include";
import { customerProfileMapper } from "./customer.mapper";

export class CustomerService {
  //--------------Get Own Profile-------------
  async getMyProfile(userId: string) {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId },
      select: CUSTOMER_PROFILE_SELECT,
    });
    if (!profile) {
      throw new AppError("Customer profile not found.", httpStatus.NOT_FOUND);
    }
    return customerProfileMapper(profile);
  }

  //--------------Update Profile-------------
  async updateProfile(userId: string, payload: TUpdateCustomerProfilePayload) {
    ensureNotEmptyObject(payload);
    await findCustomerProfileByUserId(userId);

    return prisma.customerProfile.update({
      where: { userId },
      data: payload,
    });
  }
}

export const customerService = new CustomerService();
