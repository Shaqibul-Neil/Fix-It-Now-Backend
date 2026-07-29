import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import { TPaymentStatus } from "../../generated/prisma/enums";
import type { SeededBooking } from "./booking.seed";
import { HOUR, inBatches, randomInt } from "./seed.helpers";

// SSLCommerz-style val_id: YYMMDDHHmmss + 15 random alphanumerics
// e.g. 260708123821wzqN0I5I6NPGFGi
function makeValId(date: Date): string {
  const ts =
    String(date.getFullYear()).slice(2) +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0") +
    String(date.getHours()).padStart(2, "0") +
    String(date.getMinutes()).padStart(2, "0") +
    String(date.getSeconds()).padStart(2, "0");

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let rand = "";
  for (let n = 0; n < 15; n++) {
    rand += chars.charAt(randomInt(0, chars.length - 1));
  }
  return ts + rand;
}

export async function seedPayments(bookings: SeededBooking[]): Promise<number> {
  const rows = bookings
    .filter((b) => b.payment !== undefined)
    .map((b) => {
      // Non-null: the filter above already dropped the bookings without one.
      const spec = b.payment!;

      const isSettled =
        spec.status === TPaymentStatus.SUCCESS ||
        spec.status === TPaymentStatus.REFUNDED;

      // The customer hits "pay" when the job is accepted, well before it is
      // completed. That attempt is what creates the row.
      const attemptedAt = new Date(
        (b.acceptedAt ?? b.scheduledAt).getTime() + randomInt(1, 20) * HOUR,
      );

      // paidAt only exists once the gateway actually settled. PENDING and
      // FAILED rows keep it null — matching payment.service.ts, which writes
      // paidAt only on the success callback.
      const paidAt = isSettled ? attemptedAt : null;

      return {
        bookingId: b.id,
        customerId: b.customerId,
        amount: b.amount,
        provider: spec.provider,
        status: spec.status,
        transactionId: randomUUID(), // UUID — matches payment.service.ts format
        valId: isSettled ? makeValId(attemptedAt) : null,
        method: isSettled ? (spec.method ?? "VISA-CARD") : null,
        paidAt,
        createdAt: attemptedAt,
      };
    });

  await inBatches(rows, 300, (chunk) =>
    prisma.payment.createMany({ data: chunk }),
  );

  return rows.length;
}
