const bookingStatusEnum = ["REQUESTED", "ACCEPTED", "DECLINED", "PAID", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

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
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "status", in: "query", required: false, schema: { type: "string", enum: bookingStatusEnum } },
        { name: "category", in: "query", required: false, schema: { type: "string" } },
        { name: "search", in: "query", required: false, schema: { type: "string" } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated bookings." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/bookings/{id}": {
    get: {
      tags: ["Bookings"],
      summary: "Any authenticated party to the booking: details",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": { description: "Booking details." },
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
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
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
      parameters: [
        { name: "status", in: "query", required: false, schema: { type: "string", enum: bookingStatusEnum } },
        { name: "category", in: "query", required: false, schema: { type: "string" } },
        { name: "search", in: "query", required: false, schema: { type: "string" } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated technician bookings." },
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
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
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
      parameters: [
        { name: "status", in: "query", required: false, schema: { type: "string", enum: bookingStatusEnum } },
        { name: "category", in: "query", required: false, schema: { type: "string" } },
        { name: "search", in: "query", required: false, schema: { type: "string" } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated all bookings." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
};
