/*
  Warnings:

  - The values [REVIEW_RECEIVED] on the enum `TNotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TNotificationType_new" AS ENUM ('BOOKING_CREATED', 'BOOKING_ACCEPTED', 'BOOKING_DECLINED', 'BOOKING_PAID', 'BOOKING_IN_PROGRESS', 'BOOKING_COMPLETED', 'BOOKING_CANCELLED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED', 'REVIEW_SUBMITTED', 'REVIEW_PUBLISHED', 'ACCOUNT_BANNED', 'ACCOUNT_REACTIVATED', 'USER_REGISTERED', 'TECHNICIAN_REGISTERED', 'AVAILABILITY_UPDATED');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "TNotificationType_new" USING ("type"::text::"TNotificationType_new");
ALTER TYPE "TNotificationType" RENAME TO "TNotificationType_old";
ALTER TYPE "TNotificationType_new" RENAME TO "TNotificationType";
DROP TYPE "public"."TNotificationType_old";
COMMIT;
