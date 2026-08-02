import type { Prisma } from "../../../../generated/prisma/client";
import type {
  CATEGORY_SERVICE_SELECT,
  CATEGORY_TECHNICIAN_SELECT,
} from "./category.include";

export interface IRankedService {
  serviceId: string;
  totalBookings: number;
}

export interface IPriceRange {
  min: string;
  max: string;
}

export interface IPublicCategoryStats {
  technicianCount: number;
  serviceCount: number;
  startingPrice: string | null;
  priceRange: IPriceRange | null;
  averageRating: string;
  totalReviews: number;
  completedJobs: number;
  totalBookings: number;
  responseMinutes: number | null;
  isTrending: boolean;
  popularServices: string[];
  rankedServices: IRankedService[];
}

export type TCategoryServiceRow = Prisma.ServiceGetPayload<{
  select: typeof CATEGORY_SERVICE_SELECT;
}>;

export type TCategoryTechnicianRow = Prisma.TechnicianProfileGetPayload<{
  select: typeof CATEGORY_TECHNICIAN_SELECT;
}>;
