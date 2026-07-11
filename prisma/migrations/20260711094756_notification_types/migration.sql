-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TNotificationType" ADD VALUE 'TECHNICIAN_ONBOARDED';
ALTER TYPE "TNotificationType" ADD VALUE 'SERVICE_CREATED';
ALTER TYPE "TNotificationType" ADD VALUE 'SERVICE_UPDATED';
ALTER TYPE "TNotificationType" ADD VALUE 'SERVICE_DELETED';
