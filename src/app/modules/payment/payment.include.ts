import type { Prisma } from "../../../../generated/prisma/client";

// Customer's own history — the payer is the viewer, so no party info is needed.
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
      service: { select: { title: true } },
    },
  },
} as const satisfies Prisma.PaymentSelect;

// Admin's list — an anonymous money row is useless for support and refunds,
// so both parties and the gateway reference come along.
export const ADMIN_PAYMENT_LIST_SELECT = {
  ...PAYMENT_LIST_SELECT,
  transactionId: true,
  customer: {
    select: {
      id: true,
      phone: true,
      users: { select: { firstName: true, lastName: true, email: true } },
    },
  },
  // This key replaces the base `booking` entirely — a spread does not deep
  // merge, so every field the base listed is repeated here.
  booking: {
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      service: { select: { title: true } },
      technician: {
        select: {
          id: true,
          users: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} as const satisfies Prisma.PaymentSelect;

export const PAYMENT_DETAILS_SELECT = {
  id: true,
  transactionId: true,
  amount: true,
  status: true,
  provider: true,
  method: true,
  paidAt: true,
  createdAt: true,
  // The row's last write. On a REFUNDED payment the gap from paidAt is the
  // only record of when the money went back, until the schema carries one.
  updatedAt: true,

  booking: {
    select: {
      id: true,
      status: true,
      notes: true,
      address: true,
      city: true,
      area: true,

      // The job's timeline, so a disputed charge can be read against it.
      scheduledAt: true,
      acceptedAt: true,
      completedAt: true,
      cancelledAt: true,

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

      technician: {
        select: {
          id: true,
          users: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} as const satisfies Prisma.PaymentSelect;

// Admin details — the payer and the gateway reference. A customer needs
// neither to read their own receipt. The booking's audit trail is not here:
// it belongs to the booking, and GET /bookings/:id already serves it.
export const ADMIN_PAYMENT_DETAILS_SELECT = {
  ...PAYMENT_DETAILS_SELECT,
  // SSLCommerz's own validation id — what a disputed charge is reconciled with.
  valId: true,
  customer: {
    select: {
      id: true,
      phone: true,
      users: { select: { firstName: true, lastName: true, email: true } },
    },
  },
} as const satisfies Prisma.PaymentSelect;

export const PAYMENT_FINALIZE_SELECT = {
  id: true,
  amount: true,
  status: true,
  bookingId: true,
  booking: {
    select: {
      customer: {
        select: {
          userId: true,
          users: { select: { firstName: true, lastName: true } },
        },
      },
      technician: { select: { userId: true } },
    },
  },
} as const satisfies Prisma.PaymentSelect;

// payment loaded on gateway failure/cancel (+ customer for notify)
export const PAYMENT_FAILURE_SELECT = {
  id: true,
  status: true,
  bookingId: true,
  booking: {
    select: {
      customer: {
        select: {
          userId: true,
          users: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} as const satisfies Prisma.PaymentSelect;

// booking lookup when initiating a payment
export const PAYMENT_CREATE_BOOKING_SELECT = {
  id: true,
  customerId: true,
  status: true,
  amount: true,
  address: true,
  service: { select: { title: true } },
} as const satisfies Prisma.BookingSelect;

// customer contact required by the payment gateway
export const PAYMENT_GATEWAY_CUSTOMER_SELECT = {
  firstName: true,
  lastName: true,
  email: true,
} as const satisfies Prisma.UserSelect;
