import {
  TBookingStatus,
  TPaymentStatus,
} from "../../../../../generated/prisma/client";
import { calculatePercentage } from "../../../../utils/utils";
import { ADMIN_BOOKING_LIST_SELECT } from "../../booking/booking.include";
import { adminBookingListMapper } from "../../booking/booking.mapper";
import { getBookingStatusBreakdown } from "../../booking/booking.model";
import {
  getAllCategoryNames,
  getLastFiveBookings,
  getPaymentsInRange,
  groupBookingByCategory,
  groupBookingsByCustomer,
  totalBooking,
  totalRevenue,
} from "../stats.model";
import {
  bucketAmountByInterval,
  buildMetrics,
  calculateRepeatRate,
  resolveComparison,
  resolveRange,
  shapeByCategory,
  zipRevenueSeries,
} from "../stats.utils";
import type { TStatsPeriodQuery } from "../stats.validation";

export class AdminStatsService {
  //  Aggregated dashboard: ONE call, ONE filter
  async getAdminDashboard(query: TStatsPeriodQuery) {
    const [overview, bookingByStatus, bookingByCategory, revenueTrend] =
      await Promise.all([
        this.getAdminDashboardOverview(query),
        this.getAdminBookingByStatus(query),
        this.getAdminBookingByCategory(query),
        this.getAdminRevenueTrend(query),
      ]);

    return {
      timePeriod: overview.timePeriod,
      stats: overview.stats,
      charts: {
        bookingsByStatus: bookingByStatus.result,
        bookingByCategory: bookingByCategory.result,
        revenueTrend: revenueTrend.result,
      },
    };
  }
  //Get Dashboard Overview KPI 5 cards
  // Get Dashboard Overview KPI 5 cards
  // Get Dashboard Overview KPI 5 cards
  async getAdminDashboardOverview(query: TStatsPeriodQuery) {
    const { current, previous } = resolveComparison(query);

    // ============================
    // Prepare all KPI queries
    // All promises start immediately
    // ============================

    const revenueQuery = Promise.all([
      totalRevenue({
        status: TPaymentStatus.SUCCESS,
        paidAt: current,
      }),

      totalRevenue({
        status: TPaymentStatus.SUCCESS,
        paidAt: previous,
      }),
    ]);

    const bookingQuery = Promise.all([
      totalBooking({
        createdAt: current,
      }),

      totalBooking({
        createdAt: previous,
      }),
    ]);

    const cancellationQuery = Promise.all([
      totalBooking({
        status: TBookingStatus.CANCELLED,
        createdAt: current,
      }),

      totalBooking({
        status: TBookingStatus.CANCELLED,
        createdAt: previous,
      }),
    ]);

    const completedBookingQuery = Promise.all([
      totalBooking({
        status: TBookingStatus.COMPLETED,
        completedAt: current,
      }),

      totalBooking({
        status: TBookingStatus.COMPLETED,
        completedAt: previous,
      }),
    ]);

    const repeatCustomerQuery = Promise.all([
      groupBookingsByCustomer({
        createdAt: current,
      }),

      groupBookingsByCustomer({
        createdAt: previous,
      }),
    ]);

    // ============================
    // Execute everything together
    // ============================

    const [
      [revenueCurrent, revenuePrevious],

      [totalBookingsCurrent, totalBookingsPrevious],

      [cancelledBookingsCurrent, cancelledBookingsPrevious],

      [completedBookingsCurrent, completedBookingsPrevious],

      [customerBookingGroupsCurrent, customerBookingGroupsPrevious],
    ] = await Promise.all([
      revenueQuery,
      bookingQuery,
      cancellationQuery,
      completedBookingQuery,
      repeatCustomerQuery,
    ]);

    // ============================
    // Calculate derived metrics
    // ============================

    const cancellationRateCurrent = calculatePercentage(
      cancelledBookingsCurrent,
      totalBookingsCurrent,
    );

    const cancellationRatePrevious = calculatePercentage(
      cancelledBookingsPrevious,
      totalBookingsPrevious,
    );

    const repeatCustomerRateCurrent = calculateRepeatRate(
      customerBookingGroupsCurrent,
    );

    const repeatCustomerRatePrevious = calculateRepeatRate(
      customerBookingGroupsPrevious,
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
          "revenue",
          "Total Revenue",
          "percentage",
          revenueCurrent,
          revenuePrevious,
        ),

        buildMetrics(
          "bookings",
          "Total Bookings",
          "percentage",
          totalBookingsCurrent,
          totalBookingsPrevious,
        ),

        buildMetrics(
          "cancellation_rate",
          "Cancellation Rate",
          "percentage",
          cancellationRateCurrent,
          cancellationRatePrevious,
        ),

        buildMetrics(
          "repeat_customer_rate",
          "Repeat Customer Rate",
          "percentage",
          repeatCustomerRateCurrent,
          repeatCustomerRatePrevious,
        ),

        buildMetrics(
          "completed_bookings",
          "Completed Bookings",
          "percentage",
          completedBookingsCurrent,
          completedBookingsPrevious,
        ),
      ],
    };
  }

  //Bookings by status
  async getAdminBookingByStatus(query: TStatsPeriodQuery) {
    const days = query.period ?? 30;
    const result = await getBookingStatusBreakdown({
      createdAt: resolveRange(query),
    });

    return { period: `${days} days`, result };
  }

  //Booking By Category
  async getAdminBookingByCategory(query: TStatsPeriodQuery) {
    const days = query.period ?? 30;
    const [rows, categories] = await Promise.all([
      groupBookingByCategory({
        createdAt: resolveRange(query),
      }),
      getAllCategoryNames(),
    ]);
    const result = shapeByCategory(rows, categories);
    return { period: `${days} days`, result };
  }

  //Revenue Trend
  async getAdminRevenueTrend(query: TStatsPeriodQuery) {
    const { current, previous } = resolveComparison(query);

    // fetch both periods in parallel
    const [currentRows, previousRows] = await Promise.all([
      getPaymentsInRange({
        status: TPaymentStatus.SUCCESS,
        paidAt: current,
      }),
      getPaymentsInRange({
        status: TPaymentStatus.SUCCESS,
        paidAt: previous,
      }),
    ]);

    // bucket EACH over its OWN range (both come out equal length)
    const currentSeries = bucketAmountByInterval(currentRows, current);
    const previousSeries = bucketAmountByInterval(previousRows, previous);

    const result = zipRevenueSeries(currentSeries, previousSeries);
    return { result };
  }

  //last 5 booking
  async getLastFiveCompletedBooking() {
    const result = await getLastFiveBookings({
      where: { status: TBookingStatus.COMPLETED },
      select: ADMIN_BOOKING_LIST_SELECT,
      orderBy: { completedAt: "desc" },
    });
    return result.map(adminBookingListMapper);
  }
}

export const adminStatsService = new AdminStatsService();
