export const servicePaths = {
  "/services": {
    get: {
      tags: ["Services"],
      summary: "Public: list services",
      description:
        "A service is only listed if it is active, its technician was approved by an admin, " +
        "and that technician's account is not banned.\n\n" +
        "Each row carries `categoryImage` and `technicianAvatar` so a card renders from the list alone. " +
        "Both are nullable — fall back to a placeholder and to initials.",
      parameters: [
        { name: "category", in: "query", required: false, schema: { type: "string" }, description: "Category slug." },
        { name: "city", in: "query", required: false, schema: { type: "string" } },
        { name: "area", in: "query", required: false, schema: { type: "string" } },
        { name: "minRating", in: "query", required: false, schema: { type: "number", minimum: 0, maximum: 5 } },
        { name: "search", in: "query", required: false, schema: { type: "string" } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated service list." },
        "400": { $ref: "#/components/responses/ValidationError" },
      },
    },
    post: {
      tags: ["Services"],
      summary: "Technician: create a service",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/ServiceCreate" } } },
      },
      responses: {
        "201": { description: "Service created." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/technician/services/my-services": {
    get: {
      tags: ["Services"],
      summary: "Technician: own services",
      description:
        "Backs the technician's catalogue screen, tabs included — `status` picks the tab. " +
        "Rows on the removed tab carry `removedBy`, which is what tells the screen whether to offer a restore.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/RecordStatusParam" },
        { name: "category", in: "query", required: false, schema: { type: "string" }, description: "Category slug." },
        { name: "city", in: "query", required: false, schema: { type: "string" } },
        { name: "area", in: "query", required: false, schema: { type: "string" } },
        { name: "minRating", in: "query", required: false, schema: { type: "number", minimum: 0, maximum: 5 } },
        { name: "search", in: "query", required: false, schema: { type: "string" } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": {
          description:
            "Paginated own services, newest first. Each row carries `isActive`, `isDeleted`, `removedBy` and " +
            "`categoryImage`.",
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/services/{id}": {
    patch: {
      tags: ["Services"],
      summary: "Technician: update own service",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/ServiceUpdate" } } },
      },
      responses: {
        "200": { description: "Service updated." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
    delete: {
      tags: ["Services"],
      summary: "Technician (own) or Admin: remove service (soft)",
      description:
        "Writes `deletedAt` and `deletedBy`. `isActive` is deliberately left alone — it is the technician's pause " +
        "switch, and a removal that overwrote it would lose whether the service was being offered at the time, " +
        "which is exactly what the restore needs.\n\n" +
        "Nothing is erased, so the bookings already placed against this service keep working — the response carries " +
        "`activeBookingCount` to say how many are still open.\n\n" +
        "Bookings do **not** block the removal. Stopping a technician from withdrawing a service because someone " +
        "booked it would leave them selling work they cannot do; the open jobs simply run to completion.\n\n" +
        "`deletedBy` is what makes the removal undoable by the right person — see the restore endpoint.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": { description: "Service removed; `activeBookingCount` included." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { description: "A technician tried to remove a service that is not theirs." },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/services/{id}/restore": {
    patch: {
      tags: ["Services"],
      summary: "Technician (own removal) or Admin: restore a removed service",
      description:
        "Clears `deletedAt` and `deletedBy`, and nothing else. The service comes back the way it was found: one " +
        "that was live before the removal is live again, one that was paused is still paused. Turning it back on " +
        "is a separate call to `PATCH /services/{id}`.\n\n" +
        "A technician may only undo **their own** removal. If an admin took the service down, the technician gets a " +
        "403 telling them to contact support — otherwise the moderation would be one click away from being reversed. " +
        "An admin can restore either kind.\n\n" +
        "404 if the category the service belongs to has since been removed: putting the row back under a dead " +
        "category would produce a service no list can reach.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": { description: "Service restored and live again." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { description: "Not the owner, or an admin removed it and the caller is the technician." },
        "404": { description: "Service not found, or its category is no longer available." },
        "409": { description: "This service is not removed." },
      },
    },
  },

  // ---------------- Admin ----------------
  "/services/admin/list": {
    get: {
      tags: ["Services"],
      summary: "Admin: list every service",
      description:
        "Same search filters as the public list but with no gates: paused services and services " +
        "owned by pending, rejected or banned technicians are all returned. That is the point — " +
        "the admin moderates exactly what customers cannot see.\n\n" +
        "`status` picks the tab, and removed rows carry `removedBy` so the admin can tell their own moderation " +
        "apart from a technician withdrawing their own listing.\n\n" +
        "`description` is **not** on these rows. It runs to 2000 characters and the table shows one line per " +
        "service, so it would be a paragraph per row that nothing renders — read it on `GET /services/admin/{id}`. " +
        "`categoryImage` and `technicianAvatar` are here instead, both nullable.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/RecordStatusParam" },
        { name: "category", in: "query", required: false, schema: { type: "string" }, description: "Category slug." },
        { name: "city", in: "query", required: false, schema: { type: "string" } },
        { name: "area", in: "query", required: false, schema: { type: "string" } },
        { name: "minRating", in: "query", required: false, schema: { type: "number", minimum: 0, maximum: 5 } },
        { name: "search", in: "query", required: false, schema: { type: "string" } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated service list with booking counts." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/services/admin/{id}": {
    get: {
      tags: ["Services"],
      summary: "Admin: service details + booking breakdown",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": { description: "Service details with `bookingsByStatus`." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
};
