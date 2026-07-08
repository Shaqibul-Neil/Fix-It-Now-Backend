import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import { TPaymentStatus } from "../../generated/prisma/enums";
import type { SeededBooking } from "./booking.seed";

// SSLCommerz-style val_id: YYMMDDHHmmss + random alphanumeric
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
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ts + rand;
}

export async function seedPayments(bookings: SeededBooking[]): Promise<number> {
  let count = 0;

  for (const b of bookings) {
    if (!b.payment) continue;
    count++;

    const isPaid =
      b.payment.status === TPaymentStatus.SUCCESS ||
      b.payment.status === TPaymentStatus.REFUNDED;
    const paidAt = b.completedAt ?? b.acceptedAt ?? b.scheduledAt;

    await prisma.payment.create({
      data: {
        bookingId: b.id,
        customerId: b.customerId,
        amount: b.amount,
        provider: b.payment.provider,
        status: b.payment.status,
        transactionId: randomUUID(), // UUID — matches payment.service.ts format
        valId: isPaid ? makeValId(paidAt) : null,
        method: isPaid ? (b.payment.method ?? "VISA-CARD") : null,
        paidAt: isPaid ? paidAt : null,
      },
    });
  }

  return count;
}
