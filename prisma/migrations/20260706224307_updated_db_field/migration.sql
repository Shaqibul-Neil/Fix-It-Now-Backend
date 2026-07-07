/*
  Warnings:

  - You are about to drop the column `end_time` on the `availability_slots` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `availability_slots` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[technician_id,day_of_week,startTime,endTime]` on the table `availability_slots` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endTime` to the `availability_slots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `availability_slots` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "availability_slots_technician_id_day_of_week_start_time_end_key";

-- AlterTable
ALTER TABLE "availability_slots" DROP COLUMN "end_time",
DROP COLUMN "start_time",
ADD COLUMN     "endTime" VARCHAR(5) NOT NULL,
ADD COLUMN     "startTime" VARCHAR(5) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "availability_slots_technician_id_day_of_week_startTime_endT_key" ON "availability_slots"("technician_id", "day_of_week", "startTime", "endTime");
