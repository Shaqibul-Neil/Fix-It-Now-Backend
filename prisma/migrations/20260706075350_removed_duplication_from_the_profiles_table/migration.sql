/*
  Warnings:

  - You are about to drop the column `first_name` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `technician_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `technician_profiles` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customer_profiles" DROP COLUMN "first_name",
DROP COLUMN "last_name";

-- AlterTable
ALTER TABLE "technician_profiles" DROP COLUMN "first_name",
DROP COLUMN "last_name";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "first_name" VARCHAR(50) NOT NULL,
ADD COLUMN     "last_name" VARCHAR(50);
