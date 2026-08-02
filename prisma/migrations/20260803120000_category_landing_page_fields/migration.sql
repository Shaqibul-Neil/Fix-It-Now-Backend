-- DropIndex
DROP INDEX "technician_profiles_skills_idx";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "category_id" UUID NOT NULL,
ADD COLUMN     "response_minutes" INTEGER;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "common_issues" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "cover_image" TEXT,
ADD COLUMN     "overview" TEXT,
ADD COLUMN     "tagline" TEXT;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "category_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "bookings_category_id_status_idx" ON "bookings"("category_id", "status");

-- CreateIndex
CREATE INDEX "reviews_category_id_status_idx" ON "reviews"("category_id", "status");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

