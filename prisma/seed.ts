import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { seedAdmins } from "./seeds/admin.seed";
import { seedCategories } from "./seeds/category.seed";
import { seedTechnicians, bookableTechnicians } from "./seeds/technician.seed";
import { seedCustomers } from "./seeds/customer.seed";
import { seedBookings } from "./seeds/booking.seed";
import { seedPayments } from "./seeds/payment.seed";
import { seedReviews } from "./seeds/review.seed";
import { seedNotifications } from "./seeds/notification.seed";
import { resetRandom } from "./seeds/seed.helpers";
import {
  TBookingStatus,
  TPaymentStatus,
  TTechnicianApprovalStatus,
  TUserStatus,
} from "../generated/prisma/enums";

const PASSWORD = "Password123!"; // same login password for EVERY seeded user (incl. admin)

// Wipe everything FK-safe (children first) so the seed is fully idempotent.
async function resetDatabase() {
  await prisma.notification.deleteMany();
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.service.deleteMany();
  await prisma.technicianProfile.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  // Fixed PRNG seed → the same rows every run, so screenshots and manual test
  // notes stay valid after a re-seed.
  resetRandom();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  console.log("🧹 Resetting database...");
  await resetDatabase();

  console.log("👤 Seeding admins...");
  const admins = await seedAdmins(passwordHash);

  console.log("🗂️  Seeding categories...");
  const categories = await seedCategories();

  console.log("🔧 Seeding technicians + services + availability...");
  const technicians = await seedTechnicians(
    categories,
    passwordHash,
    admins.primaryId,
  );

  console.log("🙋 Seeding customers...");
  const customers = await seedCustomers(passwordHash);

  console.log("📅 Seeding bookings + status history...");
  const bookings = await seedBookings(technicians, customers);

  console.log("💳 Seeding payments...");
  const payments = await seedPayments(bookings);

  console.log("⭐ Seeding reviews...");
  const reviewCount = await seedReviews(bookings, technicians);

  console.log("🔔 Seeding notifications...");
  const notificationCount = await seedNotifications(
    bookings,
    technicians,
    customers,
    categories,
    admins,
  );

  // ---------- summary ----------
  const approved = technicians.filter(
    (t) => t.approvalStatus === TTechnicianApprovalStatus.APPROVED,
  ).length;
  const pending = technicians.filter(
    (t) => t.approvalStatus === TTechnicianApprovalStatus.PENDING,
  ).length;
  const rejected = technicians.filter(
    (t) => t.approvalStatus === TTechnicianApprovalStatus.REJECTED,
  ).length;
  const bannedTechnicians = technicians.filter(
    (t) => t.userStatus === TUserStatus.BANNED,
  ).length;
  const removedTechnicians = technicians.filter((t) => t.isRemoved).length;

  const bannedCustomers = customers.filter(
    (c) => c.status === TUserStatus.BANNED,
  ).length;
  const removedCustomers = customers.filter((c) => c.isRemoved).length;

  const allServices = technicians.flatMap((t) => t.services);
  const serviceCount = allServices.length;
  const removedByOwner = allServices.filter(
    (s) => s.removedBy === "owner",
  ).length;
  const removedByAdmin = allServices.filter(
    (s) => s.removedBy === "admin",
  ).length;

  // isActive:false with deletedAt still null — switched off, not removed. This
  // is exactly what `?status=paused` returns, so the number printed here is the
  // number that tab should show.
  const pausedServices = await prisma.service.count({
    where: { isActive: false, deletedAt: null },
  });

  // Removed rows keep the switch position they had, so some of them read
  // isActive:false. Printing the count proves the restore has something to put
  // back off rather than turning everything on.
  const pausedBeforeRemoval = await prisma.service.count({
    where: { isActive: false, deletedAt: { not: null } },
  });

  const byStatus = Object.values(TBookingStatus)
    .map((status) => {
      const count = bookings.filter((b) => b.status === status).length;
      return `${status}=${count}`;
    })
    .join("  ");

  const paymentsByStatus = Object.values(TPaymentStatus)
    .map((status) => `${status}=${payments.byStatus[status]}`)
    .join("  ");

  const bookable = bookableTechnicians(technicians);
  const perTech = bookable.map(
    (t) => bookings.filter((b) => b.technicianId === t.profileId).length,
  );
  const minPerTech = Math.min(...perTech);

  console.log("\n✅ Seed complete.\n");
  console.log(`   Login password for ALL users : ${PASSWORD}`);
  console.log("   Admin      : admin@fixitnow.com  |  moderator@fixitnow.com");
  console.log("   Technician : karim.tech@fixitnow.com   (APPROVED)");
  console.log("   Technician : alamgir20.tech@fixitnow.com (PENDING review)");
  console.log("   Technician : bashir40.tech@fixitnow.com  (REJECTED)");
  console.log("   Technician : babul43.tech@fixitnow.com   (BANNED)");
  console.log("   Technician : alamin48.tech@fixitnow.com  (APPROVED + account REMOVED)");
  console.log("   Technician : motiur49.tech@fixitnow.com  (REJECTED + account REMOVED)");
  console.log("   Customer   : nadia.cust@fixitnow.com");
  console.log("   Customer   : jahid.cust@fixitnow.com     (BANNED)");
  console.log("   Customer   : sadia8.cust@fixitnow.com    (BANNED + REMOVED)");
  console.log("   Customer   : nusrat12.cust@fixitnow.com  (account REMOVED)");
  console.log("");
  console.log(
    `   Categories    : ${categories.all.length} live  ${categories.pausedCount} paused  ${categories.deletedCount} removed`,
  );
  console.log(
    `   Technicians   : ${technicians.length}  (approved=${approved}  pending=${pending}  rejected=${rejected}  banned=${bannedTechnicians}  removed=${removedTechnicians})`,
  );
  console.log(
    `   Services      : ${serviceCount}  (paused=${pausedServices}  removed by owner=${removedByOwner}  removed by admin=${removedByAdmin}  removed while paused=${pausedBeforeRemoval})`,
  );
  console.log(
    `   Customers     : ${customers.length}  (banned=${bannedCustomers}  removed=${removedCustomers})`,
  );
  console.log(
    `   Bookings      : ${bookings.length}  (min ${minPerTech} per approved technician)`,
  );
  console.log(`   ${byStatus}`);
  console.log(`   Payments      : ${payments.total}`);
  console.log(`   ${paymentsByStatus}`);
  console.log(`   Reviews       : ${reviewCount}`);
  console.log(`   Notifications : ${notificationCount}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
