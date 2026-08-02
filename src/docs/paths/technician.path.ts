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
  "/technicians/profile/availability": {
    patch: {
      tags: ["Technicians"],
      summary: "Technician: turn bookings on or off",
      description:
        "One switch, flipped by the technician themselves. Turning it off stops new bookings — `POST /bookings` " +
        "refuses with a 400 — while the profile, the services and the weekly schedule all stay exactly where they are, " +
        "so turning it back on needs nothing else.\n\n" +
        "The technician stays in the public list either way: being on leave is not the same as being gone.\n\n" +
        "Sending the value it already has is fine and returns 200. A toggle is naturally idempotent and nothing here " +
        "fires a notification a repeat could duplicate.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/TechnicianAvailabilityUpdate" },
            examples: {
              pause: { summary: "Stop taking new bookings", value: { isAvailable: false } },
              resume: { summary: "Start taking bookings again", value: { isAvailable: true } },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "The new state.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid", description: "TechnicianProfile id." },
                  isAvailable: { type: "boolean", example: false },
                },
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { description: "No technician profile yet — finish onboarding first." },
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
        "`reviews` is the **5 most recent published reviews only**, not the archive. `totalReviews` is the real " +
        "count; send the customer to `GET /technicians/{id}/reviews` for the paginated rest.\n\n" +
        "Carries the technician's weekly `availability` so the profile page can show it without a second call. " +
        "Do not drive the booking panel from this response though: it also drags along the review preview and " +
        "every service. The panel wants `GET /technicians/{id}/availability`.",
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
        "every other tab is sorted by rating.\n\n" +
        "`approvalStatus` and `accountStatus` filter two unrelated things — the review decision and whether the " +
        "account can sign in — so they combine freely: `?approvalStatus=APPROVED&accountStatus=BANNED` is the list " +
        "of approved technicians who have since been banned.\n\n" +
        "This list is read-only. Banning and removing an account happen under `/admin/users/{id}`, using the " +
        "`userId` on each row.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "approvalStatus",
          in: "query",
          required: false,
          schema: { $ref: "#/components/schemas/TechnicianApprovalStatus" },
          description: "Tab filter. Omit to get technicians in every state.",
        },
        {
          name: "accountStatus",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["ACTIVE", "BANNED"] },
          description: "Account state, independent of the approval decision.",
        },
        { $ref: "#/components/parameters/IncludeDeletedParam" },
        { name: "city", in: "query", required: false, schema: { type: "string" } },
        { name: "search", in: "query", required: false, schema: { type: "string" }, description: "Matches first or last name." },
        { name: "minRating", in: "query", required: false, schema: { type: "number", minimum: 1, maximum: 5 } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": paginatedList("#/components/schemas/TechnicianAdminListItem", "Paginated admin technician list.", 50),
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
        "Answers for technicians in every state, so a PENDING application is reviewed from the same screen an " +
        "approved profile is inspected from.\n\n" +
        "Carries what the public route leaves out — the review decision, the account state, the phone number, and " +
        "every service including the ones switched off or removed — plus a per-status booking count.",
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
        "Records the onboarding decision and notifies the technician. Approving unlocks publishing services and " +
        "public listing; rejecting hides them until they resubmit. `id` is the TechnicianProfile id (the `id` from " +
        "the admin list), not the User id.\n\n" +
        "**The decision is one-way.** `PENDING → APPROVED`, `PENDING → REJECTED` and `REJECTED → APPROVED` are all " +
        "allowed, but an approved technician can never be sent back to REJECTED — that returns 409.\n\n" +
        "This is deliberate. Approval answers *did this application pass*, not *is this technician behaving*, and " +
        "the second question has its own answer: ban the account at `PATCH /admin/users/{id}` using the `userId` on " +
        "the row. A ban only an admin can lift; a rejection the technician can undo themselves, because editing " +
        "their profile puts a REJECTED row back in the queue and clears the rejection reason with it.",
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
