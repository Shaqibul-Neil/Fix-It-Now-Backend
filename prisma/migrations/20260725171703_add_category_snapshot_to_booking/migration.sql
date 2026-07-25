/*
  Warnings:

  - Added the required column `category_name` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "category_name" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "bookings_category_name_idx" ON "bookings"("category_name");
