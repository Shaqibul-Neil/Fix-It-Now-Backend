/*
  Warnings:

  - You are about to drop the column `is_approved` on the `technician_profiles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TTechnicianApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TNotificationType" ADD VALUE 'TECHNICIAN_APPROVED';
ALTER TYPE "TNotificationType" ADD VALUE 'TECHNICIAN_REJECTED';

-- AlterTable
ALTER TABLE "technician_profiles" DROP COLUMN "is_approved",
ADD COLUMN     "approval_status" "TTechnicianApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by" UUID;

-- CreateIndex
CREATE INDEX "technician_profiles_approval_status_idx" ON "technician_profiles"("approval_status");
