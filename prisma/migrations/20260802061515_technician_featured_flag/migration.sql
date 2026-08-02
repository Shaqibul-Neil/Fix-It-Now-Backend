-- AlterTable
ALTER TABLE "technician_profiles" ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "technician_profiles_is_featured_average_rating_idx" ON "technician_profiles"("is_featured", "average_rating");
