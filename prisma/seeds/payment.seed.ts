import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import { TPaymentProvider, TPaymentStatus } from "../../generated/prisma/enums";
import type { SeededBooking } from "./booking.seed";
import { DAY, HOUR, MINUTE, inBatches, randomInt } from "./seed.helpers";

export interface SeededPaymentSummary {
  total: number;
  byStatus: Record<TPaymentStatus, number>;
}

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

// When the row was last written. Prisma stamps @updatedAt with now() unless it
// is passed explicitly, which would leave a three-month-old payment reading
// "updated today" on the admin screen.
function lastWriteAt(status: TPaymentStatus, attemptedAt: Date): Date {
  switch (status) {
    case TPaymentStatus.REFUNDED:
      // The refund is processed days after the payment cleared. Until the
      // schema carries refundedAt, this gap is the only trace of when it ran.
      return new Date(attemptedAt.getTime() + randomInt(2, 9) * DAY);
    case TPaymentStatus.FAILED:
      // The gateway rejects within minutes of the attempt.
      return new Date(attemptedAt.getTime() + randomInt(2, 30) * MINUTE);
    default:
      // SUCCESS settles on the callback; PENDING is never touched again.
      return attemptedAt;
  }
}

export async function seedPayments(
  bookings: SeededBooking[],
): Promise<SeededPaymentSummary> {
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

      // val_id is SSLCommerz's own validation reference, written by
      // finalizePayment after it re-validates the transaction. The app has no
      // Stripe code path, so a Stripe row must never carry one.
      const hasValId =
        isSettled && spec.provider === TPaymentProvider.SSLCOMMERZ;

      return {
        bookingId: b.id,
        customerId: b.customerId,
        amount: b.amount,
        provider: spec.provider,
        status: spec.status,
        transactionId: randomUUID(), // UUID — matches payment.service.ts format
        valId: hasValId ? makeValId(attemptedAt) : null,
        method: isSettled ? (spec.method ?? "VISA-CARD") : null,
        paidAt,
        createdAt: attemptedAt,
        updatedAt: lastWriteAt(spec.status, attemptedAt),
      };
    });

  await inBatches(rows, 300, (chunk) =>
    prisma.payment.createMany({ data: chunk }),
  );

  const byStatus = Object.values(TPaymentStatus).reduce(
    (acc, status) => {
      acc[status] = rows.filter((row) => row.status === status).length;
      return acc;
    },
    {} as Record<TPaymentStatus, number>,
  );

  return { total: rows.length, byStatus };
}
