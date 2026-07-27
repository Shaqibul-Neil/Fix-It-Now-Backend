import type { Prisma } from "../../../../generated/prisma/client";
import type { TInterval, TRange } from "../../../types/types";
import {
  calculatePercentage,
  dayBucketKey,
  generateBuckets,
  getDateFromPeriod,
  MILLISECONDS_PER_DAY,
  monthBucketKey,
  pickInterval,
  weekBucketKey,
} from "../../../utils/utils";
import type { IStatData, TMetricType, TRevenueBucket } from "./stats.interface";
import type { TStatsPeriodQuery } from "./stats.validation";

//metrics data with month over month comparison
export const buildMetrics = (
  id: string,
  label: string,
  type: TMetricType,
  current: number,
  previous: number,
): IStatData => {
  const changeValue = Number((current - previous).toFixed(2));

  let changePercentage = 0;
  if (previous === 0) {
    changePercentage = current > 0 ? 100 : 0;
  } else {
    changePercentage = calculatePercentage(current - previous, previous);
  }

  if (type === "percentage") {
    return {
      id,
      label,
      value: current,
      changePercentage,
    };
  }

  return {
    id,
    label,
    value: current,
    changeValue,
  };
};

//Repeat customer percentage calculation
export const calculateRepeatRate = (items: { _count: number }[]): number => {
  if (items.length === 0) return 0;
  const repeatItems = items.filter((item) => item._count > 1);
  return calculatePercentage(repeatItems.length, items.length);
};

//query (from/to, or last 30 days) periods, or last 30 days
export const resolveRange = (query: TStatsPeriodQuery): TRange => {
  const now = new Date();
  if (query.from || query.to) {
    return { gte: query.from ?? getDateFromPeriod(30), lte: query.to ?? now };
  }
  return { gte: getDateFromPeriod(query.period ?? 30), lte: now };
};

// current + previous
export const resolveComparison = (
  query: TStatsPeriodQuery,
): { current: TRange; previous: TRange } => {
  const current = resolveRange(query);
  const length = current.lte.getTime() - current.gte.getTime();

  return {
    current,
    previous: {
      gte: new Date(current.gte.getTime() - length),
      lte: current.gte,
    },
  };
};

// Fill all statuses (missing = 0)
export const shapeByStatus = <T extends string>(
  rows: { status: T; _count: number }[],
  statuses: readonly T[],
): { status: T; count: number }[] => {
  const counts = new Map(rows.map((row) => [row.status, row._count]));
  return statuses.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
};

// Fill all categories (missing = 0)
export const shapeByCategory = (
  rows: { categoryName: string; _count: number }[],
  categories: readonly string[],
): { category: string; count: number }[] => {
  const counts = new Map(rows.map((row) => [row.categoryName, row._count]));
  return categories.map((category) => ({
    category,
    count: counts.get(category) ?? 0,
  }));
};

// Group payments into per-day revenue totals, zero-filling days with no sales.
export const bucketRevenueByInterval = (
  rows: { paidAt: Date; amount: Prisma.Decimal }[],
  range: TRange,
): TRevenueBucket[] => {
  const interval = pickInterval(range);

  /**
   * Step 1:
   * Group payments
   */

  const totals = rows.reduce<Record<string, number>>((acc, row) => {
    let key: string;

    if (interval === "day") {
      key = dayBucketKey(row.paidAt);
    } else if (interval === "week") {
      key = weekBucketKey(row.paidAt, range);
    } else {
      key = monthBucketKey(row.paidAt);
    }
    acc[key] = (acc[key] ?? 0) + row.amount.toNumber();

    return acc;
  }, {});

  /**
   * Step 2:
   * Zero fill missing buckets
   */

  const buckets = generateBuckets(range, interval);

  return buckets.map((date) => ({ date, total: totals[date] ?? 0 }));
};

// Overlay two equal-length daily arrays by index (period-over-period).
export const zipRevenueSeries = (
  current: TRevenueBucket[],
  previous: TRevenueBucket[],
): { date: string; current: number; previous: number }[] => {
  return current.map((day, i) => ({
    date: day.date,
    current: day.total,
    previous: previous[i]?.total ?? 0,
  }));
};
