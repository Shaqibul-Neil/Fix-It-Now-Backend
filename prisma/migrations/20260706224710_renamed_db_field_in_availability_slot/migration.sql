/*
  Warnings:

  - You are about to drop the column `endTime` on the `availability_slots` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `availability_slots` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[technician_id,day_of_week,start_time,end_time]` on the table `availability_slots` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `end_time` to the `availability_slots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `availability_slots` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "availability_slots_technician_id_day_of_week_startTime_endT_key";

-- AlterTable
ALTER TABLE "availability_slots" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "end_time" VARCHAR(5) NOT NULL,
ADD COLUMN     "start_time" VARCHAR(5) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "availability_slots_technician_id_day_of_week_start_time_end_key" ON "availability_slots"("technician_id", "day_of_week", "start_time", "end_time");
