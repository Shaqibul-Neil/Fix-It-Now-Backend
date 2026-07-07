import type { Prisma } from "../../../../generated/prisma/client";

export const BOOKING_LIST_INCLUDE = {
  id: true,
  status: true,
  amount: true,
  scheduledAt: true,
  createdAt: true,
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
} as const satisfies Prisma.BookingSelect;

export const CUSTOMER_BOOKING_INCLUDE = {
  service: {
    select: {
      id: true,
      title: true,
      price: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },

  technician: {
    select: {
      id: true,
      averageRating: true,
      users: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  },

  statusHistory: {
    orderBy: {
      createdAt: "asc",
    },
  },
} as const;

export const TECHNICIAN_BOOKING_INCLUDE = {
  service: {
    select: {
      id: true,
      title: true,
      price: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },

  customer: {
    select: {
      id: true,
      phone: true,
      users: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  },

  statusHistory: {
    select: { status: true, note: true, createdAt: true },
    orderBy: {
      createdAt: "asc",
    },
  },
} as const;

export const ADMIN_BOOKING_INCLUDE = {
  service: true,
  customer: {
    include: {
      users: true,
    },
  },
  technician: {
    include: {
      users: true,
    },
  },
  statusHistory: {
    orderBy: {
      createdAt: "asc",
    },
  },
} as const;
