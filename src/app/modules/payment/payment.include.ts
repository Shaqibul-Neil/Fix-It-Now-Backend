import type { Prisma } from "../../../../generated/prisma/client";

export const PAYMENT_LIST_SELECT = {
  id: true,
  amount: true,
  status: true,
  provider: true,
  method: true,
  paidAt: true,
  createdAt: true,
  booking: {
    select: {
      id: true,
      service: {
        select: {
          title: true,
        },
      },
    },
  },
} satisfies Prisma.PaymentSelect;
