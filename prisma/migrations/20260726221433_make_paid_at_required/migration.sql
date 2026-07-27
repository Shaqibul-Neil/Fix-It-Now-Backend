/*
  Warnings:

  - Made the column `paid_at` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "paid_at" SET NOT NULL;
