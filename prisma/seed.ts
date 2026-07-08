import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { seedAdmin } from "./seeds/admin.seed";
import { seedCategories } from "./seeds/category.seed";
import { seedTechnicians } from "./seeds/technician.seed";
import { seedCustomers } from "./seeds/customer.seed";
import { seedBookings } from "./seeds/booking.seed";
import { seedPayments } from "./seeds/payment.seed";
import { seedReviews } from "./seeds/review.seed";

const PASSWORD = "Password123!"; // same login password for EVERY seeded user (incl. admin)

// Wipe everything FK-safe (children first) so the seed is fully idempotent.
async function resetDatabase() {
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
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await resetDatabase();

  await seedAdmin(passwordHash);
  const categories = await seedCategories();
  const technicians = await seedTechnicians(categories, passwordHash);
  const customers = await seedCustomers(passwordHash);
  const bookings = await seedBookings(technicians, customers);
  const paymentCount = await seedPayments(bookings);
  const reviewCount = await seedReviews(bookings, technicians);

  console.log("✅ Seed complete.");
  console.log(`   Login password for ALL users: ${PASSWORD}`);
  console.log("   Admin:      admin@fixitnow.com");
  console.log("   Technician: karim.tech@fixitnow.com (+5 more, 1 BANNED)");
  console.log("   Customer:   nadia.cust@fixitnow.com (+5 more, 1 BANNED)");
  console.log(
    `   Bookings: ${bookings.length}, Payments: ${paymentCount}, Reviews: ${reviewCount}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
