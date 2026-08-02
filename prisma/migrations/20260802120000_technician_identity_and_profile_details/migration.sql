-- AlterTable
ALTER TABLE "technician_profiles" DROP COLUMN "coverImage",
ADD COLUMN     "cover_image" TEXT,
ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "emergency_contact_name" VARCHAR(100),
ADD COLUMN     "emergency_contact_phone" VARCHAR(20),
ADD COLUMN     "national_id" VARCHAR(20) NOT NULL,
ADD COLUMN     "nid_document" TEXT,
ADD COLUMN     "offers_emergency_service" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passport_number" VARCHAR(20),
ADD COLUMN     "professional_title" VARCHAR(120),
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "work_highlights" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "technician_profiles_national_id_key" ON "technician_profiles"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "technician_profiles_passport_number_key" ON "technician_profiles"("passport_number");

-- CreateIndex
CREATE INDEX "technician_profiles_hourly_rate_idx" ON "technician_profiles"("hourly_rate");

-- CreateIndex
-- Written by hand: the Prisma schema language cannot declare a GIN index, and a
-- B-tree is useless to `skills @> ARRAY[...]`, which is what the sidebar's skill
-- checkboxes compile to.
CREATE INDEX "technician_profiles_skills_idx" ON "technician_profiles" USING GIN ("skills");
