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

// A checkbox group on the sidebar: repeat the key once per box that is ticked
// (`?skills=Pipe+fitting&skills=Leak+detection`). A single value is accepted too,
// so a one-box selection does not need special-casing on the client.
const checkboxGroup = (name: string, items: object, description: string) => ({
  name,
  in: "query",
  required: false,
  style: "form",
  explode: true,
  schema: { type: "array", items },
  description,
});

// A "true"/"false" string, not a real boolean — it arrives from a query string.
const booleanFlag = (name: string, description: string) => ({
  name,
  in: "query",
  required: false,
  schema: { type: "string", enum: ["true", "false"] },
  description,
});

export const technicianPaths = {
  "/technicians/profile": {
    post: {
      tags: ["Technicians"],
      summary: "Create own technician profile",
      description:
        "The onboarding form. Marks the profile complete and enters the review queue as PENDING — the technician " +
        "is not listed, and cannot publish services, until an admin approves it.\n\n" +
        "One profile per account, and one profile per National ID.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/TechnicianProfileCreate" } } },
      },
      responses: {
        "201": { description: "Profile created; admins notified of the new application." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "409": {
          description:
            "This account already has a profile, or the National ID is registered to another technician.",
        },
      },
    },
    patch: {
      tags: ["Technicians"],
      summary: "Update own technician profile",
      description:
        "Partial update — send only the groups that changed. Editing a REJECTED profile clears the rejection and " +
        "puts it back in the review queue as PENDING.\n\n" +
        "`identity` is the one group that stops being editable: once the application is APPROVED it is refused " +
        "with 403, because swapping the NID afterwards would keep a badge an admin granted to a different person.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/TechnicianProfileUpdate" } } },
      },
      responses: {
        "200": { description: "Profile updated." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": {
          description: "Not a technician, or an approved technician tried to change `identity`.",
        },
        "404": { description: "No technician profile yet — create one first." },
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
        "The technician stays in the public list either way: being on leave is not the same as being gone. Customers " +
        "see it as `isAvailable`, and `?acceptingClients=true` is the filter that hides them.\n\n" +
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
      description:
        "The technician's own row, every column included — identity documents, the approval decision and the " +
        "rejection reason among them. It is their own data, so nothing is stripped the way the public route strips it.\n\n" +
        "Services and the weekly schedule are not in here; they have their own modules.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Own technician profile.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/TechnicianMyProfile" } } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { description: "Onboarding was never completed." },
      },
    },
  },
  "/technicians": {
    get: {
      tags: ["Technicians"],
      summary: "Public: list technicians",
      description:
        "Only technicians with a completed profile, an APPROVED review decision and a non-banned, non-removed " +
        "account are returned. A ban is an account action, not a review decision, so both gates apply.\n\n" +
        "Every parameter below is one control on the search page. Groups combine with AND, boxes inside a group " +
        "with OR: `?city=Dhaka&city=Chittagong&priceBuckets=under_500` reads *(Dhaka or Chittagong) and under 500*. " +
        "Fetch `GET /technicians/filters` for the values and counts to draw the sidebar with.",
      parameters: [
        checkboxGroup(
          "city",
          { type: "string" },
          "One or more cities, case-insensitive. Repeat the key per city.",
        ),
        checkboxGroup(
          "categoryIds",
          { type: "string", format: "uuid" },
          "Category ids from `GET /technicians/filters`. Matches technicians with at least one live service in any of them.",
        ),
        checkboxGroup(
          "skills",
          { type: "string" },
          "Exact skill strings — use the spellings `GET /technicians/filters` returns, not free text.",
        ),
        checkboxGroup(
          "priceBuckets",
          { type: "string", enum: ["under_500", "500_1000", "1000_2000", "2000_plus"] },
          "Hourly-rate bands in BDT. Ranges are half-open, so 500 lands in `500_1000` and never in `under_500`.",
        ),
        {
          name: "sort",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["best_match", "top_rated", "most_reviewed", "price_low", "price_high", "newest"],
            default: "best_match",
          },
          description:
            "`best_match` puts featured technicians first, then rating, then review count. Every option ends with " +
            "a unique tiebreaker, so paging never repeats or skips a row.",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Matches first name, last name, city or area, case-insensitive.",
        },
        { name: "minRating", in: "query", required: false, schema: { type: "number", minimum: 1, maximum: 5 } },
        booleanFlag("acceptingClients", "Only technicians taking new bookings right now (`isAvailable`)."),
        booleanFlag("emergencyService", "Only technicians who take urgent, out-of-hours call-outs."),
        booleanFlag("featured", "`true` for the spotlight list; `false` for everyone else. Omit for both."),
        booleanFlag(
          "eveningAvailable",
          "Has an active weekly slot running past 18:00 — the schedule, not today's calendar.",
        ),
        booleanFlag("weekendAvailable", "Has an active slot on Friday or Saturday, the Bangladeshi weekend."),
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": paginatedList("#/components/schemas/TechnicianListItem", "Paginated technician list.", 21),
        "400": { $ref: "#/components/responses/ValidationError" },
      },
    },
  },
  "/technicians/filters": {
    get: {
      tags: ["Technicians"],
      summary: "Public: filter sidebar options and counts",
      description:
        "The values `GET /technicians` accepts, with a count beside each one, computed against the same gates the " +
        "list applies. Takes no parameters: the counts are for the unfiltered list, so the sidebar can be fetched " +
        "once alongside the page instead of re-fetched on every tick.",
      responses: {
        "200": {
          description: "Filter facets.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/TechnicianFilterFacets" } } },
        },
      },
    },
  },
  "/technicians/{id}": {
    get: {
      tags: ["Technicians"],
      summary: "Public: technician details",
      description:
        "404 for a PENDING, REJECTED or banned technician — a direct link must not expose a profile the list hides.\n\n" +
        "**Nothing identifying is returned.** No National ID, NID scan, passport, date of birth, street address, " +
        "phone number or emergency contact. A customer needs to know the technician was checked, not what the check " +
        "was made of, so the whole review collapses into `isVerified`. The admin route carries the rest.\n\n" +
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
        "pass it to filter a single bucket. PENDING comes back oldest-first (a review queue); every other tab is " +
        "newest-first.\n\n" +
        "There is no `sort` here on purpose. This is a moderation table, not the customer-facing search: the order " +
        "follows the tab, and the sidebar's checkbox groups (`skills`, `priceBuckets`, `categoryIds`, the " +
        "availability flags) are not accepted either. Adding a filter to the public list tomorrow does not " +
        "silently land on this one.\n\n" +
        "`approvalStatus` and `accountStatus` filter two unrelated things — the review decision and whether the " +
        "account can sign in — so they combine freely: `?approvalStatus=APPROVED&accountStatus=BANNED` is the list " +
        "of approved technicians who have since been banned.\n\n" +
        "This list is read-only. Banning and removing an account happen under `/admin/users/{id}`, using the " +
        "`userId` on each row; featuring happens at `PATCH /technicians/admin/{id}/featured`.",
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
        booleanFlag(
          "featured",
          "Spotlight state. `true` is who is on the home page right now; " +
            "`?approvalStatus=APPROVED&featured=false` is the pool of technicians who could be promoted and have " +
            "not been. Only an approved technician can be featured, so `featured=true` never returns anyone else.",
        ),
        { $ref: "#/components/parameters/IncludeDeletedParam" },
        {
          name: "city",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Single city, case-insensitive. One value only — the public list is the one that takes several.",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description:
            "Matches first name, last name, city or area, case-insensitive. Area has no filter of its own here; " +
            "this is where you narrow to one.",
        },
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
      summary: "Admin: technician details + identity + booking breakdown",
      description:
        "Answers for technicians in every state, so a PENDING application is reviewed from the same screen an " +
        "approved profile is inspected from.\n\n" +
        "Carries what the public route leaves out — the identity documents under `identity`, the review decision " +
        "and who made it, the account state, the phone number and street address, and every service including the " +
        "ones switched off or removed — plus a per-status booking count.\n\n" +
        "Every identity field comes back whether it was filled in or not: on a review screen a null is a real " +
        "answer, not a missing one.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "TechnicianProfile id." }],
      responses: {
        "200": {
          description: "Technician details with `identity` and `bookingsByStatus`.",
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
  "/technicians/admin/{id}/featured": {
    patch: {
      tags: ["Technicians"],
      summary: "Admin: feature or unfeature a technician",
      description:
        "The spotlight switch. A featured technician sorts to the top of the default public list and is what " +
        "`GET /technicians?featured=true` returns.\n\n" +
        "Only an APPROVED technician can be featured — featuring anyone else would put a card on the home page for " +
        "someone the public list itself filters out, so that returns 409. Unfeaturing is always allowed, which is " +
        "what makes this safe to call on a technician who was just banned.\n\n" +
        "`id` is the TechnicianProfile id, not the User id.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/TechnicianFeaturedUpdate" },
            examples: {
              feature: { summary: "Put on the spotlight list", value: { isFeatured: true } },
              unfeature: { summary: "Take off the spotlight list", value: { isFeatured: false } },
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
                  isFeatured: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "409": { description: "Not approved — only an approved technician can be featured." },
      },
    },
  },
};
