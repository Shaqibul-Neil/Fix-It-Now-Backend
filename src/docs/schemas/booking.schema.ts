export const bookingSchemas = {
  BookingCreate: {
    type: "object",
    required: ["serviceId", "scheduledAt", "address"],
    properties: {
      serviceId: { type: "string", format: "uuid" },
      scheduledAt: { type: "string", format: "date-time", description: "Must be in the future." },
      address: { type: "string", minLength: 1, maxLength: 500, example: "House 12, Road 3" },
      city: { type: "string", maxLength: 100, example: "Dhaka" },
      area: { type: "string", maxLength: 100, example: "Gulshan" },
      notes: { type: "string", maxLength: 2000 },
    },
  },
  BookingStatusUpdate: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"],
        description: "Technician transitions only.",
      },
      note: { type: "string", maxLength: 500 },
    },
  },
  BookingStatus: {
    type: "string",
    enum: ["REQUESTED", "ACCEPTED", "DECLINED", "PAID", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
    example: "COMPLETED",
  },
  BookingListBase: {
    type: "object",
    description: "The columns every booking row carries, whoever is reading the list.",
    properties: {
      id: { type: "string", format: "uuid" },
      status: { $ref: "#/components/schemas/BookingStatus" },
      amount: { type: "string", description: "Decimal serialised as a string.", example: "1500.00" },
      category: { type: "string", description: "Category name as it was when the booking was made.", example: "Plumbing" },
      scheduledAt: { type: "string", format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      completedAt: { type: "string", format: "date-time", nullable: true },
      serviceId: { type: "string", format: "uuid" },
      serviceTitle: { type: "string", example: "Emergency pipe leak repair" },
    },
  },
  CustomerBookingListItem: {
    allOf: [
      { $ref: "#/components/schemas/BookingListBase" },
      {
        type: "object",
        description:
          "The customer's row: the counterparty is the technician, plus whether this booking has already been reviewed.",
        properties: {
          technicianName: { type: "string", example: "Karim Mia" },
          technicianEmail: { type: "string", format: "email" },
          technicianPhone: { type: "string", example: "01710000001" },
          reviewId: {
            type: "string",
            format: "uuid",
            nullable: true,
            description:
              "null means no review exists yet. Offer the review action when this is null and `status` is COMPLETED — " +
              "those are the same two conditions the server enforces, so the button matches the outcome.",
          },
          reviewStatus: {
            allOf: [{ $ref: "#/components/schemas/ReviewStatus" }],
            nullable: true,
            description:
              "null when `reviewId` is null. PENDING means the review was submitted but is not published anywhere " +
              "yet — say so, or the customer sees nothing and writes it a second time.",
          },
        },
      },
    ],
  },
  TechnicianBookingListItem: {
    allOf: [
      { $ref: "#/components/schemas/BookingListBase" },
      {
        type: "object",
        description: "The technician's row: the counterparty is the customer.",
        properties: {
          customerName: { type: "string", example: "Nadia Akter" },
          customerEmail: { type: "string", format: "email" },
          customerPhone: { type: "string", example: "01810000001" },
        },
      },
    ],
  },
  AdminBookingListItem: {
    allOf: [
      { $ref: "#/components/schemas/BookingListBase" },
      {
        type: "object",
        description: "The admin's row: both parties.",
        properties: {
          customerName: { type: "string", example: "Nadia Akter" },
          customerEmail: { type: "string", format: "email" },
          customerPhone: { type: "string", example: "01810000001" },
          technicianName: { type: "string", example: "Karim Mia" },
          technicianEmail: { type: "string", format: "email" },
          technicianPhone: { type: "string", example: "01710000001" },
        },
      },
    ],
  },
  BookingDetailsBase: {
    type: "object",
    description:
      "The booking row itself. Shared by all three details responses — what differs is which relations come with it.",
    properties: {
      id: { type: "string", format: "uuid" },
      customerId: { type: "string", format: "uuid" },
      technicianId: { type: "string", format: "uuid" },
      serviceId: { type: "string", format: "uuid" },
      status: { $ref: "#/components/schemas/BookingStatus" },
      address: { type: "string", example: "House 12, Road 3" },
      city: { type: "string", nullable: true, example: "Dhaka" },
      area: { type: "string", nullable: true, example: "Gulshan" },
      notes: { type: "string", nullable: true },
      amount: { type: "string", description: "Decimal serialised as a string.", example: "1500.00" },
      categoryName: { type: "string", example: "Plumbing" },
      scheduledAt: { type: "string", format: "date-time" },
      acceptedAt: { type: "string", format: "date-time", nullable: true },
      completedAt: { type: "string", format: "date-time", nullable: true },
      cancelledAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  BookingServiceRef: {
    type: "object",
    description: "The service as it is now — the booking's own `amount` is the price that was agreed.",
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string", example: "Emergency pipe leak repair" },
      price: { type: "string", description: "Decimal serialised as a string.", example: "1500.00" },
      category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Plumbing" },
        },
      },
    },
  },
  AdminBookingServiceRef: {
    allOf: [
      { $ref: "#/components/schemas/BookingServiceRef" },
      {
        type: "object",
        properties: {
          isActive: {
            type: "boolean",
            description: "Whether the technician still offers this service — a switched-off one still has live bookings.",
          },
        },
      },
    ],
  },
  BookingCounterparty: {
    type: "object",
    description: "The other side of the booking. `id` is the profile id.",
    properties: {
      id: { type: "string", format: "uuid" },
      phone: { type: "string", example: "01810000001" },
      users: {
        type: "object",
        properties: {
          firstName: { type: "string", example: "Nadia" },
          lastName: { type: "string", example: "Akter" },
          email: { type: "string", format: "email" },
        },
      },
    },
  },
  AdminBookingCounterparty: {
    type: "object",
    description:
      "Both parties on the admin screen. `users.id` is the account id, so an admin can go from a booking straight to " +
      "the user. Nothing else off the User row is exposed here.",
    properties: {
      id: { type: "string", format: "uuid", description: "Profile id." },
      phone: { type: "string", example: "01810000001" },
      users: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", description: "User account id." },
          firstName: { type: "string", example: "Nadia" },
          lastName: { type: "string", example: "Akter" },
          email: { type: "string", format: "email" },
        },
      },
    },
  },
  BookingStatusEvent: {
    type: "object",
    description: "One entry of the booking timeline, oldest first.",
    properties: {
      status: { $ref: "#/components/schemas/BookingStatus" },
      note: { type: "string", nullable: true, description: "Free text the actor left — a decline reason, for example." },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  AdminBookingStatusEvent: {
    allOf: [
      { $ref: "#/components/schemas/BookingStatusEvent" },
      {
        type: "object",
        properties: {
          changedById: {
            type: "string",
            format: "uuid",
            nullable: true,
            description: "The User account that made the transition. Admin-only: on a disputed booking this is the question.",
          },
        },
      },
    ],
  },
  BookingReviewRef: {
    type: "object",
    nullable: true,
    description: "The review for this booking, or null if it has not been reviewed. One review per booking, ever.",
    properties: {
      id: { type: "string", format: "uuid" },
      status: { $ref: "#/components/schemas/ReviewStatus" },
    },
  },
  CustomerBookingDetails: {
    allOf: [
      { $ref: "#/components/schemas/BookingDetailsBase" },
      {
        type: "object",
        properties: {
          service: { $ref: "#/components/schemas/BookingServiceRef" },
          technician: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              averageRating: { type: "number", example: 4.5 },
              users: {
                type: "object",
                properties: {
                  firstName: { type: "string", example: "Karim" },
                  lastName: { type: "string", example: "Mia" },
                },
              },
            },
          },
          statusHistory: { type: "array", items: { $ref: "#/components/schemas/BookingStatusEvent" } },
          review: { $ref: "#/components/schemas/BookingReviewRef" },
        },
      },
    ],
  },
  TechnicianBookingDetails: {
    allOf: [
      { $ref: "#/components/schemas/BookingDetailsBase" },
      {
        type: "object",
        properties: {
          service: { $ref: "#/components/schemas/BookingServiceRef" },
          customer: { $ref: "#/components/schemas/BookingCounterparty" },
          statusHistory: { type: "array", items: { $ref: "#/components/schemas/BookingStatusEvent" } },
        },
      },
    ],
  },
  AdminBookingDetails: {
    allOf: [
      { $ref: "#/components/schemas/BookingDetailsBase" },
      {
        type: "object",
        properties: {
          service: { $ref: "#/components/schemas/AdminBookingServiceRef" },
          customer: { $ref: "#/components/schemas/AdminBookingCounterparty" },
          technician: { $ref: "#/components/schemas/AdminBookingCounterparty" },
          statusHistory: { type: "array", items: { $ref: "#/components/schemas/AdminBookingStatusEvent" } },
        },
      },
    ],
  },
};
