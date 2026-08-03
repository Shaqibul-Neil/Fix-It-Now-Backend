-- CreateEnum
CREATE TYPE "TMaintenanceType" AS ENUM ('RECURRING', 'OCCASIONAL', 'NONE');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "maintenance_interval_days" INTEGER,
ADD COLUMN     "maintenance_type" "TMaintenanceType" NOT NULL DEFAULT 'NONE';
