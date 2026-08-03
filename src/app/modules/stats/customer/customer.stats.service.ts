import { TBookingStatus } from "../../../../../generated/prisma/enums";
import { createFullName } from "../../../../utils/utils";
import { totalBooking } from "../stats.model";
import { customerActiveBookingMapper } from "./customer.stats.mapper";
import {
  findCustomerActiveBookings,
  findCustomerTechnicians,
  findRecurringCategories,
  groupCustomerBookingsByCategory,
  groupCustomerRatingsByTechnician,
} from "./customer.stats.model";
import { buildMaintenance, buildStat } from "./customer.stats.utils";

const TOP_TECHNICIAN_LIMIT = 4;

export class CustomerStatsService {
  async getCustomerDashboard(userId: string) {
    const completedForCustomer = {
      customer: { userId },
      status: TBookingStatus.COMPLETED,
    } as const;

    const [
      categoryGroups,
      technicianRows,
      ratingGroups,
      activeRows,
      recurringCategories,
      completedCount,
      awaitingReview,
    ] = await Promise.all([
      groupCustomerBookingsByCategory(userId),
      findCustomerTechnicians(userId),
      groupCustomerRatingsByTechnician(userId),
      findCustomerActiveBookings(userId),
      findRecurringCategories(),
      totalBooking(completedForCustomer),
      totalBooking({ ...completedForCustomer, review: { is: null } }),
    ]);

    // ---------- Pie chart ----------
    const serviceMix = categoryGroups.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      count: row._count._all,
    }));

    // ---------- Maintenance ----------
    const lastServiceByCategory = new Map(
      categoryGroups.map((row) => [row.categoryId, row._max.completedAt]),
    );
    const maintenance = buildMaintenance(
      recurringCategories,
      lastServiceByCategory,
    );
    const maintenanceDue = maintenance.filter(
      (item) => item.status === "due",
    ).length;

    // ---------- Technicians ----------
    const ratingByTechnician = new Map(
      ratingGroups.map((row) => [row.technicianId, row._avg.rating]),
    );
    const technicians = technicianRows
      .map((technician) => {
        const rating = ratingByTechnician.get(technician.id);

        return {
          id: technician.id,
          name: createFullName(
            technician.users.firstName,
            technician.users.lastName,
          ),
          avatar: technician.avatar,
          professionalTitle: technician.professionalTitle,
          jobsTogether: technician._count.bookings,
          yourRating:
            rating === null || rating === undefined
              ? null
              : Number(rating.toFixed(1)),
        };
      })
      .sort((a, b) => b.jobsTogether - a.jobsTogether)
      .slice(0, TOP_TECHNICIAN_LIMIT);

    // ---------- Active bookings ----------
    const activeBookings = activeRows.map(customerActiveBookingMapper);
    const [primary, ...others] = activeBookings;

    return {
      stats: [
        buildStat(
          "active_bookings",
          "Active Bookings",
          activeBookings.length,
          "/dashboard/customer/bookings",
        ),
        buildStat(
          "pending_reviews",
          "Awaiting Your Review",
          awaitingReview,
          "/dashboard/customer/reviews",
        ),
        buildStat(
          "completed_jobs",
          "Jobs Completed",
          completedCount,
          "/dashboard/customer/bookings?status=COMPLETED",
        ),
        buildStat(
          "your_technicians",
          "Your Technicians",
          technicianRows.length,
          "/dashboard/customer/bookings?status=COMPLETED",
        ),
        buildStat(
          "maintenance_due",
          "Maintenance Due",
          maintenanceDue,
          "/dashboard/customer#maintenance",
        ),
      ],
      maintenance,
      serviceMix,
      // Total is the same number the stat card shows — the list itself is the
      // top few, so the card and the block can never disagree.
      technicians: { total: technicianRows.length, items: technicians },
      activeBooking: {
        total: activeBookings.length,
        primary: primary ?? null,
        others,
      },
    };
  }
}
export const customerStatsService = new CustomerStatsService();
