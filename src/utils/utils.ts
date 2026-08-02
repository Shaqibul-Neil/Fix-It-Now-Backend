import httpStatus from "http-status";
import slugify from "slugify";
import { AppError } from "./appError";
import type { TInterval, TRange } from "../types/types";

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

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

//creating full name from first and last
export const createFullName = (
  firstName?: string | null,
  lastName?: string | null,
  fallback = "",
): string => `${firstName ?? ""} ${lastName ?? ""}`.trim() || fallback;

//get the months
export const monthWindows = () => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return {
    thisMonth: {
      gte: startOfThisMonth,
    },
    lastMonth: {
      gte: startOfLastMonth,
      lt: startOfThisMonth,
    },
  };
};

//percentage calculation
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(2));
};

//Calculating how big the bucket size should be in chart
export const pickInterval = (range: TRange): TInterval => {
  const totalDays =
    (range.lte.getTime() - range.gte.getTime()) / MILLISECONDS_PER_DAY;
  if (totalDays <= 15) return "day";
  else if (totalDays <= 90) return "week";
  else return "month";
};

// Convert date to YYYY-MM-DD
export const formatDate = (date: Date) => date.toISOString().slice(0, 10);

// Day bucket key : all the payments in one day goes to same bucket
export const dayBucketKey = (date: Date) => formatDate(date);

/**
 * Week bucket key
 *
 * Week starts from selected range start.
 * Not calendar Monday.
 */
export const weekBucketKey = (date: Date, range: TRange) => {
  //difference between payment date and range start in milliseconds
  const diff = date.getTime() - range.gte.getTime();

  //find out in which week it goes like 9/7 = 1.25, 2d week
  const weekIndex = Math.floor(diff / (7 * MILLISECONDS_PER_DAY));

  //get the start date of that particular  means if user selects from range july 1 this is the first day of the week and the week ends at july 8
  const bucketStart = new Date(
    range.gte.getTime() + weekIndex * 7 * MILLISECONDS_PER_DAY,
  );

  return formatDate(bucketStart);
};

/**
 * Calendar month bucket key
 *
 * Example:
 * Jan 31 -> 2026-01
 * Feb 28 -> 2026-02
 */
export const monthBucketKey = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

/**
 * Generate all buckets between dates
 */
export const generateBuckets = (
  range: TRange,
  interval: TInterval,
): string[] => {
  const result: string[] = [];
  //create a copy of the date as Date object is mutable;
  const fromDate = new Date(range.gte);

  //For Month
  if (interval === "month") {
    // Avoid JS month overflow issue.
    // Example: Jan 31 + 1 month can become Mar 3.
    // Reset to the first day of the month before incrementing.
    fromDate.setDate(1);

    while (fromDate <= range.lte) {
      result.push(monthBucketKey(fromDate));
      //advance one month
      fromDate.setMonth(fromDate.getMonth() + 1);
    }
    return result;
  }

  //For Day and Week
  const step =
    interval === "day" ? MILLISECONDS_PER_DAY : 7 * MILLISECONDS_PER_DAY;

  while (fromDate <= range.lte) {
    result.push(
      interval === "day"
        ? dayBucketKey(fromDate)
        : weekBucketKey(fromDate, range),
    );

    fromDate.setTime(fromDate.getTime() + step);
  }
  return result;
};

// One blank line separates paragraphs
export const toParagraphs = (text: string | null): string[] =>
  text
    ? text
        .split(/\r?\n\s*\r?\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [];
