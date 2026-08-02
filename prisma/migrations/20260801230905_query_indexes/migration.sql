-- DropIndex
DROP INDEX "bookings_technician_id_idx";

-- DropIndex
DROP INDEX "reviews_status_idx";

-- DropIndex
DROP INDEX "reviews_technician_id_idx";

-- DropIndex
DROP INDEX "services_category_id_idx";

-- CreateIndex
CREATE INDEX "bookings_technician_id_scheduled_at_idx" ON "bookings"("technician_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "reviews_technician_id_status_idx" ON "reviews"("technician_id", "status");

-- CreateIndex
CREATE INDEX "services_category_id_is_active_idx" ON "services"("category_id", "is_active");
