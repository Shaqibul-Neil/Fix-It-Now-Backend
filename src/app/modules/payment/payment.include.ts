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

export const PAYMENT_DETAILS_SELECT = {
  id: true,
  transactionId: true,
  amount: true,
  status: true,
  provider: true,
  method: true,
  valId: true,
  paidAt: true,
  createdAt: true,

  booking: {
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      address: true,
      city: true,
      area: true,

      service: {
        select: {
          id: true,
          title: true,
          price: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PaymentSelect;
