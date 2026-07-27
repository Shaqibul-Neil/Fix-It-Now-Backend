import {
  TBookingStatus,
  TPaymentStatus,
} from "../../../../../generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import { calculatePercentage } from "../../../../utils/utils";
import { ADMIN_BOOKING_LIST_SELECT } from "../../booking/booking.include";
import { adminBookingListMapper } from "../../booking/booking.mapper";
import {
  getBookingStatusBreakdown,
  groupBookingByStatus,
} from "../../booking/booking.model";
import {
  getAllCategoryNames,
  getPaymentsInRange,
  groupBookingByCategory,
  groupBookingsByCustomer,
  totalBooking,
  totalRevenue,
} from "../stats.model";
import {
  bucketRevenueByInterval,
  buildMetrics,
  calculateRepeatRate,
  resolveComparison,
  resolveRange,
  shapeByCategory,
  shapeByStatus,
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
  async getAdminDashboardOverview(query: TStatsPeriodQuery) {
    const { current, previous } = resolveComparison(query);
    const [
      revenueNow,
      revenuePrev,
      bookingNow,
      bookingPrev,
      cancelledNow,
      cancelledPrev,
      completedNow,
      completedPrev,
      customersNow,
      customersPrev,
    ] = await Promise.all([
      // total revenue comparison
      totalRevenue({ status: TPaymentStatus.SUCCESS, paidAt: current }),
      totalRevenue({ status: TPaymentStatus.SUCCESS, paidAt: previous }),

      // total bookings comparison
      totalBooking({ createdAt: current }),
      totalBooking({ createdAt: previous }),

      // total cancelled bookings comparison
      totalBooking({
        status: TBookingStatus.CANCELLED,
        createdAt: current,
      }),
      totalBooking({
        status: TBookingStatus.CANCELLED,
        createdAt: previous,
      }),

      // completed bookings (by completedAt — jobs finished in window)
      totalBooking({
        status: TBookingStatus.COMPLETED,
        createdAt: current,
      }),
      totalBooking({
        status: TBookingStatus.COMPLETED,
        createdAt: previous,
      }),

      // per-customer booking counts (for repeat rate)
      groupBookingsByCustomer({ createdAt: current }),
      groupBookingsByCustomer({ createdAt: previous }),
    ]);

    // cancellation rate % = cancelled / total * 100
    const cancellationRateNow = calculatePercentage(cancelledNow, bookingNow);
    const cancellationRatePrev = calculatePercentage(
      cancelledPrev,
      bookingPrev,
    );

    // repeat customer rate % = (customers with >1 booking) / total customers * 100
    const repeatRateNow = calculateRepeatRate(customersNow);
    const repeatRatePrev = calculateRepeatRate(customersPrev);
    return {
      timePeriod: { from: current.gte, to: current.lte },
      stats: [
        buildMetrics(
          "revenue",
          "Total Revenue",
          "percentage",
          revenueNow,
          revenuePrev,
        ),
        buildMetrics(
          "bookings",
          "Total Bookings",
          "percentage",
          bookingNow,
          bookingPrev,
        ),
        buildMetrics(
          "cancellation_rate",
          "Cancellation Rate",
          "percentage",
          cancellationRateNow,
          cancellationRatePrev,
        ),
        buildMetrics(
          "repeat_customer_rate",
          "Repeat Customer Rate",
          "percentage",
          repeatRateNow,
          repeatRatePrev,
        ),
        buildMetrics(
          "completed_bookings",
          "Completed Bookings",
          "percentage",
          completedNow,
          completedPrev,
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
    const currentSeries = bucketRevenueByInterval(currentRows, current);
    const previousSeries = bucketRevenueByInterval(previousRows, previous);

    const result = zipRevenueSeries(currentSeries, previousSeries);
    return { result };
  }

  //last 5 booking
  async getLastFiveCompletedBooking() {
    const result = await prisma.booking.findMany({
      where: { status: TBookingStatus.COMPLETED },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: ADMIN_BOOKING_LIST_SELECT,
    });
    return result.map(adminBookingListMapper);
  }
}

export const adminStatsService = new AdminStatsService();
