/*
  Warnings:

  - You are about to drop the column `technicianId` on the `availability_slots` table. All the data in the column will be lost.
  - You are about to drop the column `booking_end_time` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `booking_start_time` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `categories` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[technician_id,day_of_week,start_time,end_time]` on the table `availability_slots` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `technician_id` to the `availability_slots` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "availability_slots" DROP CONSTRAINT "availability_slots_technicianId_fkey";

-- DropIndex
DROP INDEX "availability_slots_day_of_week_idx";

-- DropIndex
DROP INDEX "availability_slots_technicianId_idx";

-- AlterTable
ALTER TABLE "availability_slots" DROP COLUMN "technicianId",
ADD COLUMN     "technician_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "booking_end_time",
DROP COLUMN "booking_start_time";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "isActive",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "availability_slots_technician_id_idx" ON "availability_slots"("technician_id");

-- CreateIndex
CREATE UNIQUE INDEX "availability_slots_technician_id_day_of_week_start_time_end_key" ON "availability_slots"("technician_id", "day_of_week", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "technician_profiles_city_area_idx" ON "technician_profiles"("city", "area");

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
