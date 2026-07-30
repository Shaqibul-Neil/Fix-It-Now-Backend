const bookingStatusEnum = ["REQUESTED", "ACCEPTED", "DECLINED", "PAID", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

// Same envelope for every paginated list in this file.
const paginatedList = (itemRef: string, description: string) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          items: { type: "array", items: { $ref: itemRef } },
          meta: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 10 },
              total: { type: "integer", example: 242 },
            },
          },
        },
      },
    },
  },
});

const listFilterParams = [
  { name: "status", in: "query", required: false, schema: { type: "string", enum: bookingStatusEnum } },
  { name: "category", in: "query", required: false, schema: { type: "string" } },
  { name: "search", in: "query", required: false, schema: { type: "string" }, description: "Matches the service title." },
  { $ref: "#/components/parameters/PageParam" },
  { $ref: "#/components/parameters/LimitParam" },
];

const idPathParam = { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } };

export const bookingPaths = {
  "/bookings": {
    post: {
      tags: ["Bookings"],
      summary: "Customer: create a booking",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/BookingCreate" } } },
      },
      responses: {
        "201": { description: "Booking created (status REQUESTED)." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
    get: {
      tags: ["Bookings"],
      summary: "Customer: list own bookings",
      description:
        "Scoped to the caller's customer profile on the server. Each row carries `reviewId` / `reviewStatus`, so the " +
        "list can tell an unreviewed completed job from one that has already been written up.",
      security: [{ bearerAuth: [] }],
      parameters: listFilterParams,
      responses: {
        "200": paginatedList("#/components/schemas/CustomerBookingListItem", "Paginated own bookings, newest first."),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/bookings/{id}": {
    get: {
      tags: ["Bookings"],
      summary: "Any authenticated party to the booking: details",
      description:
        "One route, three payloads — the response shape follows the caller's role. A customer or technician who is " +
        "not a party to the booking gets 403.",
      security: [{ bearerAuth: [] }],
      parameters: [idPathParam],
      responses: {
        "200": {
          description: "Booking details, shaped for the caller's role.",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/CustomerBookingDetails" },
                  { $ref: "#/components/schemas/TechnicianBookingDetails" },
                  { $ref: "#/components/schemas/AdminBookingDetails" },
                ],
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/bookings/{id}/cancel": {
    patch: {
      tags: ["Bookings"],
      summary: "Customer: cancel own booking",
      security: [{ bearerAuth: [] }],
      parameters: [idPathParam],
      responses: {
        "200": { description: "Booking cancelled." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/technician/bookings": {
    get: {
      tags: ["Bookings"],
      summary: "Technician: list bookings for own jobs",
      security: [{ bearerAuth: [] }],
      parameters: listFilterParams,
      responses: {
        "200": paginatedList("#/components/schemas/TechnicianBookingListItem", "Paginated technician bookings, newest first."),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/technician/bookings/{id}": {
    patch: {
      tags: ["Bookings"],
      summary: "Technician: update booking status",
      description: "Allowed transitions: ACCEPTED, DECLINED, IN_PROGRESS, COMPLETED.",
      security: [{ bearerAuth: [] }],
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/BookingStatusUpdate" } } },
      },
      responses: {
        "200": { description: "Status updated." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/admin/bookings": {
    get: {
      tags: ["Bookings"],
      summary: "Admin: list all bookings",
      security: [{ bearerAuth: [] }],
      parameters: listFilterParams,
      responses: {
        "200": paginatedList("#/components/schemas/AdminBookingListItem", "Paginated bookings across the platform, newest first."),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
};
