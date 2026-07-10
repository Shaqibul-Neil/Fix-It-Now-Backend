import httpStatus from "http-status";
import slugify from "slugify";
import { AppError } from "./appError";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

//Generates a URL-friendly slug from a string.
export const generateSlug = (value: string): string => {
  return slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  });
};

//Checks if the data is empty or not
export const ensureNotEmptyObject = (
  obj: object,
  message = "No fields provided.",
) => {
  if (Object.keys(obj).length === 0) {
    throw new AppError(message, httpStatus.BAD_REQUEST);
  }
};

//Get pagination
export const getPagination = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    page,
    limit,
    skip,
  };
};

//Get Date from the time period
export const getDateFromPeriod = (days: number) =>
  new Date(Date.now() - days * MILLISECONDS_PER_DAY);
