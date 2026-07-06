/*
  Warnings:

  - Made the column `phone` on table `technician_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bio` on table `technician_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `experience_years` on table `technician_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hourly_rate` on table `technician_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `technician_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `technician_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `area` on table `technician_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "technician_profiles" ADD COLUMN     "is_profile_complete" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "bio" SET NOT NULL,
ALTER COLUMN "experience_years" SET NOT NULL,
ALTER COLUMN "hourly_rate" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "area" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;
