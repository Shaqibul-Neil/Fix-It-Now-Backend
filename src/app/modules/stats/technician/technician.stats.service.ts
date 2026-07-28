import {
  TBookingStatus,
  type Prisma,
} from "../../../../../generated/prisma/client";
import config from "../../../../config";
import { calculatePercentage } from "../../../../utils/utils";
import { TECHNICIAN_BOOKING_LIST_SELECT } from "../../booking/booking.include";
import { technicianBookingListMapper } from "../../booking/booking.mapper";
import { getBookingStatusBreakdown } from "../../booking/booking.model";
import { findTechnicianProfileByUserId } from "../../technician/technician.model";
import {
  getCompletedBookingsInRange,
  getLastFiveBookings,
  getTechnicianAverageRating,
  sumBookingAmount,
  totalBooking,
} from "../stats.model";
import {
  bucketRevenueByInterval,
  buildMetrics,
  resolveComparison,
  resolveRange,
  zipRevenueSeries,
} from "../stats.utils";
import type { TStatsPeriodQuery } from "../stats.validation";

// jobs the technician actually took on (completion-rate denominator)
const ACCEPTED_ONWARD = [
  TBookingStatus.ACCEPTED,
  TBookingStatus.PAID,
  TBookingStatus.IN_PROGRESS,
  TBookingStatus.COMPLETED,
];

export class TechnicianStatsService {
  // Aggregated dashboard: ONE call, ONE filter (resolve technician once)
  async getTechnicianDashboard(userId: string, query: TStatsPeriodQuery) {
    const technician = await findTechnicianProfileByUserId(userId);
    const technicianId = technician.id;

    const [overview, jobsByStatus, earningsTrend] = await Promise.all([
      this.getTechnicianOverview(technicianId, query),
      this.getTechnicianJobsByStatus(technicianId, query),
      this.getTechnicianEarningsTrend(technicianId, query),
    ]);

    return {
      timePeriod: overview.timePeriod,
      stats: overview.stats,
      charts: {
        jobsByStatus: jobsByStatus.result,
        earningsTrend: earningsTrend.result,
      },
    };
  }

  // ---------- 5 KPI overview ----------
  async getTechnicianOverview(technicianId: string, query: TStatsPeriodQuery) {
    const { current, previous } = resolveComparison(query);

    // ============================
    // Prepare KPI queries
    // All queries will execute in parallel
    // ============================

    // Earnings KPI
    const earningsQuery = Promise.all([
      sumBookingAmount({
        technicianId,
        status: TBookingStatus.COMPLETED,
        completedAt: current,
      }),

      sumBookingAmount({
        technicianId,
        status: TBookingStatus.COMPLETED,
        completedAt: previous,
      }),
    ]);

    // Completed Jobs KPI
    const completedJobsQuery = Promise.all([
      totalBooking({
        technicianId,
        status: TBookingStatus.COMPLETED,
        completedAt: current,
      }),

      totalBooking({
        technicianId,
        status: TBookingStatus.COMPLETED,
        completedAt: previous,
      }),
    ]);

    // Completion Rate KPI
    const completionRateQuery = Promise.all([
      // Completed jobs from this period's booking group
      totalBooking({
        technicianId,
        status: TBookingStatus.COMPLETED,
        createdAt: current,
      }),

      totalBooking({
        technicianId,
        status: TBookingStatus.COMPLETED,
        createdAt: previous,
      }),

      // Jobs technician actually accepted
      totalBooking({
        technicianId,
        status: {
          in: ACCEPTED_ONWARD,
        },
        createdAt: current,
      }),

      totalBooking({
        technicianId,
        status: {
          in: ACCEPTED_ONWARD,
        },
        createdAt: previous,
      }),
    ]);

    //  New Requests KPI
    const newRequestsQuery = Promise.all([
      totalBooking({
        technicianId,
        status: TBookingStatus.REQUESTED,
        createdAt: current,
      }),

      totalBooking({
        technicianId,
        status: TBookingStatus.REQUESTED,
        createdAt: previous,
      }),
    ]);

    // Average Rating KPI
    const ratingQuery = getTechnicianAverageRating(technicianId);

    // ============================
    // Execute everything together
    // ============================

    const [
      [earningBaseCurrent, earningBasePrevious],

      [completedJobsCurrent, completedJobsPrevious],

      [
        completedJobsForRateCurrent,
        completedJobsForRatePrevious,
        acceptedJobsCurrent,
        acceptedJobsPrevious,
      ],

      [newRequestsCurrent, newRequestsPrevious],

      averageRating,
    ] = await Promise.all([
      earningsQuery,
      completedJobsQuery,
      completionRateQuery,
      newRequestsQuery,
      ratingQuery,
    ]);

    // ============================
    // Calculate derived values
    // ============================

    // Technician gets only his share
    const technicianEarningCurrent =
      earningBaseCurrent * config.technician_share;

    const technicianEarningPrevious =
      earningBasePrevious * config.technician_share;

    const completionRateCurrent = calculatePercentage(
      completedJobsForRateCurrent,
      acceptedJobsCurrent,
    );

    const completionRatePrevious = calculatePercentage(
      completedJobsForRatePrevious,
      acceptedJobsPrevious,
    );

    // ============================
    // Return KPI cards
    // ============================

    return {
      timePeriod: {
        from: current.gte,
        to: current.lte,
      },

      stats: [
        buildMetrics(
          "earnings",
          "Total Earnings",
          "value",
          technicianEarningCurrent,
          technicianEarningPrevious,
        ),

        buildMetrics(
          "completed_jobs",
          "Completed Jobs",
          "value",
          completedJobsCurrent,
          completedJobsPrevious,
        ),

        buildMetrics(
          "completion_rate",
          "Completion Rate",
          "percentage",
          completionRateCurrent,
          completionRatePrevious,
        ),

        buildMetrics(
          "new_requests",
          "New Requests",
          "value",
          newRequestsCurrent,
          newRequestsPrevious,
        ),

        buildMetrics(
          "average_rating",
          "Average Rating",
          "value",
          averageRating,
          averageRating,
        ),
      ],
    };
  }

  // ---------- Jobs by status (pie) ----------
  async getTechnicianJobsByStatus(
    technicianId: string,
    query: TStatsPeriodQuery,
  ) {
    const days = query.period ?? 30;
    const result = await getBookingStatusBreakdown({
      technicianId,
      createdAt: resolveRange(query),
    });
    return { period: `${days} days`, result };
  }

  // ---------- Earnings trend (area: current vs previous) ----------
  async getTechnicianEarningsTrend(
    technicianId: string,
    query: TStatsPeriodQuery,
  ) {
    const { current, previous } = resolveComparison(query);

    const [currentRows, previousRows] = await Promise.all([
      getCompletedBookingsInRange({
        technicianId,
        status: TBookingStatus.COMPLETED,
        completedAt: current,
      }),
      getCompletedBookingsInRange({
        technicianId,
        status: TBookingStatus.COMPLETED,
        completedAt: previous,
      }),
    ]);

    // bucket util reads `paidAt`; completed bookings carry `completedAt` (non-null here)
    const toBucketRows = (
      rows: { completedAt: Date | null; amount: Prisma.Decimal }[],
    ) => rows.map((r) => ({ paidAt: r.completedAt as Date, amount: r.amount }));

    const currentSeries = bucketRevenueByInterval(
      toBucketRows(currentRows),
      current,
    );
    const previousSeries = bucketRevenueByInterval(
      toBucketRows(previousRows),
      previous,
    );

    // buckets hold full booking totals
    const share = config.technician_share;
    const result = zipRevenueSeries(currentSeries, previousSeries).map((d) => ({
      date: d.date,
      current: Number((d.current * share).toFixed(2)),
      previous: Number((d.previous * share).toFixed(2)),
    }));

    return { result };
  }

  // ---------- Recent job requests (table, separate endpoint) ----------
  async getTechnicianRecentRequests(userId: string) {
    const technician = await findTechnicianProfileByUserId(userId);
    const result = await getLastFiveBookings({
      where: {
        technicianId: technician.id,
        status: TBookingStatus.REQUESTED,
      },
      select: TECHNICIAN_BOOKING_LIST_SELECT,
      orderBy: { createdAt: "desc" },
    });
    return result.map(technicianBookingListMapper);
  }
}

export const technicianStatsService = new TechnicianStatsService();
