-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
