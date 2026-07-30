import type { Prisma } from "../../../../generated/prisma/client";

//------------------------------------
// Booking list (shared columns every list row needs)
export const BOOKING_LIST_BASE = {
  id: true,
  status: true,
  amount: true,
  categoryName: true,
  scheduledAt: true,
  createdAt: true,
  completedAt: true,
  service: {
    select: {
      id: true,
      title: true,
    },
  },
} as const satisfies Prisma.BookingSelect;

// reusable counterparty shape (name + contact)
const LIST_PARTY_SELECT = {
  id: true,
  phone: true,
  users: {
    select: { firstName: true, lastName: true, email: true },
  },
} as const satisfies Prisma.TechnicianProfileSelect &
  Prisma.CustomerProfileSelect;

// Same party on the admin details screen, plus the User id so an admin can jump
// from the booking to the account. Spelled out field by field rather than
// `include: { users: true }` — User carries passwordHash, and an include hands
// back every scalar on the row.
const DETAILS_PARTY_SELECT = {
  id: true,
  phone: true,
  users: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
} as const satisfies Prisma.TechnicianProfileSelect &
  Prisma.CustomerProfileSelect;

// The reviewed-or-not marker on a customer's booking. One nullable row over the
// 1-1 relation, so it costs a join and no extra query. `status` rides along
// because a PENDING review is not visible anywhere yet — without it the customer
// sees their review vanish and writes it again.
const BOOKING_REVIEW_SELECT = {
  select: { id: true, status: true },
} as const satisfies Prisma.BookingSelect["review"];

//------------------------------------
// Customer's list -> sees the TECHNICIAN (counterparty)
export const CUSTOMER_BOOKING_LIST_SELECT = {
  ...BOOKING_LIST_BASE,
  technician: { select: LIST_PARTY_SELECT },
  review: BOOKING_REVIEW_SELECT,
} as const satisfies Prisma.BookingSelect;

//------------------------------------
// Technician's list -> sees the CUSTOMER
export const TECHNICIAN_BOOKING_LIST_SELECT = {
  ...BOOKING_LIST_BASE,
  customer: { select: LIST_PARTY_SELECT },
} as const satisfies Prisma.BookingSelect;

//------------------------------------
// Admin's list -> sees BOTH parties
export const ADMIN_BOOKING_LIST_SELECT = {
  ...BOOKING_LIST_BASE,
  customer: { select: LIST_PARTY_SELECT },
  technician: { select: LIST_PARTY_SELECT },
} as const satisfies Prisma.BookingSelect;

//------------------------------------
// Customer booking details
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

  // Same three columns the technician's details serves. Left open it would also
  // ship bookingId and changedById — internal ids the customer has no use for.
  statusHistory: {
    select: { status: true, note: true, createdAt: true },
    orderBy: {
      createdAt: "asc",
    },
  },

  // Whether this booking has already been reviewed. The details page carries the
  // same "Write a review" action as the list row, so it needs the same answer.
  review: BOOKING_REVIEW_SELECT,
} as const;

//------------------------------------
// Technician booking details
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

//------------------------------------
// Admin booking details
//
// Every relation is an explicit select. `include: { users: true }` used to sit
// on both parties here, and since Prisma returns every scalar of an included
// row, that put two bcrypt password hashes in the response of every admin
// booking lookup. The details endpoint returns the query result as-is — there is
// no mapper downstream to drop a field this file leaves in.
export const ADMIN_BOOKING_INCLUDE = {
  service: {
    select: {
      id: true,
      title: true,
      price: true,
      isActive: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },

  customer: { select: DETAILS_PARTY_SELECT },
  technician: { select: DETAILS_PARTY_SELECT },

  // `changedById` stays for the admin only: on a disputed booking, which account
  // moved it to CANCELLED is the whole question.
  statusHistory: {
    select: {
      status: true,
      note: true,
      changedById: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  },
} as const;

//------------------------------------
// service lookup when creating a booking (price + technician userId for notify)
export const BOOKING_CREATE_SERVICE_SELECT = {
  id: true,
  isActive: true,
  price: true,
  technicianId: true,
  technician: { select: { userId: true } },
  category: { select: { name: true } },
} as const satisfies Prisma.ServiceSelect;

//------------------------------------
// booking returned right after creation (+ customer name for notify)
export const BOOKING_CREATED_INCLUDE = {
  service: { select: { id: true, title: true, price: true } },
  customer: {
    select: { users: { select: { firstName: true, lastName: true } } },
  },
} as const satisfies Prisma.BookingInclude;

//------------------------------------
// booking returned after cancel
export const BOOKING_CANCEL_INCLUDE = {
  service: { select: { id: true, title: true } },
} as const satisfies Prisma.BookingInclude;

//------------------------------------
// booking loaded before a cancel (+ parties for notify)
export const BOOKING_CANCEL_SELECT = {
  id: true,
  customerId: true,
  status: true,
  technician: { select: { userId: true } },
  customer: {
    select: { users: { select: { firstName: true, lastName: true } } },
  },
} as const satisfies Prisma.BookingSelect;

//------------------------------------
// booking loaded before a technician status update (+ both parties for notify)
export const BOOKING_STATUS_UPDATE_SELECT = {
  id: true,
  technicianId: true,
  status: true,
  amount: true,
  customer: { select: { userId: true } },
  technician: {
    select: { users: { select: { firstName: true, lastName: true } } },
  },
} as const satisfies Prisma.BookingSelect;

//------------------------------------
// booking returned after a status update
export const BOOKING_STATUS_RESULT_SELECT = {
  id: true,
  status: true,
  acceptedAt: true,
  completedAt: true,
} as const satisfies Prisma.BookingSelect;

// technician's active slots for the availability check (create booking)
export const BOOKING_AVAILABILITY_SLOT_SELECT = {
  dayOfWeek: true,
  startTime: true,
  endTime: true,
} as const satisfies Prisma.AvailabilitySlotSelect;
