import httpStatus from "http-status";
import slugify from "slugify";
import { AppError } from "./appError";

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
