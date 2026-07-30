// Same shape for every paginated list in this file.
const paginatedList = (itemRef: string, description: string, totalExample: number) => ({
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
              total: { type: "integer", example: totalExample },
            },
          },
        },
      },
    },
  },
});

export const technicianPaths = {
  "/technicians/profile": {
    post: {
      tags: ["Technicians"],
      summary: "Create own technician profile",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/TechnicianProfileCreate" } } },
      },
      responses: {
        "201": { description: "Profile created." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
    patch: {
      tags: ["Technicians"],
      summary: "Update own technician profile",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/TechnicianProfileUpdate" } } },
      },
      responses: {
        "200": { description: "Profile updated." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/technicians/profile/me": {
    get: {
      tags: ["Technicians"],
      summary: "Get own technician profile",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Own technician profile." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/technicians": {
    get: {
      tags: ["Technicians"],
      summary: "Public: list technicians",
      description:
        "Only technicians with a completed profile, an APPROVED review decision and a non-banned " +
        "account are returned. A ban is an account action, not a review decision, so both gates apply.",
      parameters: [
        { name: "city", in: "query", required: false, schema: { type: "string" } },
        { name: "search", in: "query", required: false, schema: { type: "string" } },
        { name: "minRating", in: "query", required: false, schema: { type: "number", minimum: 1, maximum: 5 } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": paginatedList("#/components/schemas/TechnicianListItem", "Paginated technician list, highest rated first.", 21),
        "400": { $ref: "#/components/responses/ValidationError" },
      },
    },
  },
  "/technicians/{id}": {
    get: {
      tags: ["Technicians"],
      summary: "Public: technician details",
      description:
        "404 for a PENDING, REJECTED or banned technician — a direct link must not expose a profile the list hides.\n\n" +
        "Carries the technician's weekly `availability` so the profile page can show it without a second call. " +
        "Do not drive the booking panel from this response though: it also drags along 20 reviews and every service. " +
        "The panel wants `GET /technicians/{id}/availability`.",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "TechnicianProfile id." }],
      responses: {
        "200": {
          description: "Technician details.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/TechnicianDetails" } } },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },

  // ---------------- Admin: approval workflow ----------------
  "/technicians/admin/list": {
    get: {
      tags: ["Technicians"],
      summary: "Admin: list technicians (every approval state)",
      description:
        "One endpoint backs all four dashboard tabs. Leave `approvalStatus` off for 'All'; " +
        "pass it to filter a single bucket. PENDING is sorted oldest-first (a review queue); " +
        "every other tab is sorted by rating.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "approvalStatus",
          in: "query",
          required: false,
          schema: { $ref: "#/components/schemas/TechnicianApprovalStatus" },
          description: "Tab filter. Omit to get technicians in every state.",
        },
        { name: "city", in: "query", required: false, schema: { type: "string" } },
        { name: "search", in: "query", required: false, schema: { type: "string" }, description: "Matches first or last name." },
        { name: "minRating", in: "query", required: false, schema: { type: "number", minimum: 1, maximum: 5 } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": paginatedList("#/components/schemas/TechnicianAdminListItem", "Paginated admin technician list.", 44),
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/technicians/admin/{id}": {
    get: {
      tags: ["Technicians"],
      summary: "Admin: technician details + booking breakdown",
      description:
        "Same detail payload as the public route but with no approval filter, plus a per-status booking count.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "TechnicianProfile id." }],
      responses: {
        "200": {
          description: "Technician details with `bookingsByStatus`.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/TechnicianAdminDetails" } } },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/technicians/admin/{id}/approval": {
    patch: {
      tags: ["Technicians"],
      summary: "Admin: approve or reject a technician",
      description:
        "Records the review decision on the profile and notifies the technician. " +
        "Approving unlocks publishing services and public listing; rejecting hides them until they resubmit. " +
        "`id` is the TechnicianProfile id (the `id` from the admin list), not the User id.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/TechnicianReviewRequest" },
            examples: {
              approve: { summary: "Approve", value: { status: "APPROVED" } },
              reject: {
                summary: "Reject (reason required, min 10 chars)",
                value: {
                  status: "REJECTED",
                  rejectionReason: "Bio is too short and the phone number could not be verified.",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "Decision saved; technician notified." },
        "400": {
          description: "Validation failed — e.g. REJECTED without a rejectionReason, or status set to PENDING.",
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "409": { description: "The technician is already in that state — the same decision twice is rejected." },
      },
    },
  },
};
