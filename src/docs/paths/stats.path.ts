// Dashboard analytics. Every "dashboard" route takes the same window selector:
// either `period` (a preset day count) or a `from`/`to` pair — never both.

const periodParams = [
  {
    name: "period",
    in: "query",
    required: false,
    schema: { type: "string", enum: ["7", "30", "90", "365"], default: "30" },
    description: "Preset window in days. Cannot be combined with from/to.",
  },
  {
    name: "from",
    in: "query",
    required: false,
    schema: { type: "string", format: "date" },
    description: "Custom window start. Must be <= `to`. Cannot be combined with `period`.",
  },
  {
    name: "to",
    in: "query",
    required: false,
    schema: { type: "string", format: "date" },
    description: "Custom window end. Cannot be combined with `period`.",
  },
];

export const statsPaths = {
  "/stats/admin/dashboard": {
    get: {
      tags: ["Stats"],
      summary: "Admin: platform dashboard (KPIs + charts)",
      description:
        "Five KPI cards with period-over-period change, plus bookings by status, bookings by category and the revenue trend.",
      security: [{ bearerAuth: [] }],
      parameters: periodParams,
      responses: {
        "200": {
          description: "Admin dashboard payload.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminDashboard" },
            },
          },
        },
        "400": {
          description:
            "Validation failed — e.g. `period` sent together with `from`/`to`, or `from` later than `to`.",
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/stats/admin/dashboard/last-five-bookings": {
    get: {
      tags: ["Stats"],
      summary: "Admin: five most recent completed bookings",
      description: "Table widget on the admin dashboard. Takes no query parameters.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Up to five completed bookings, newest first." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/stats/technician/dashboard": {
    get: {
      tags: ["Stats"],
      summary: "Technician: own dashboard (KPIs + charts)",
      description:
        "Scoped to the logged-in technician's profile. 404 if the technician has not completed onboarding yet.",
      security: [{ bearerAuth: [] }],
      parameters: periodParams,
      responses: {
        "200": {
          description: "Technician dashboard payload.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TechnicianDashboard" },
            },
          },
        },
        "400": {
          description:
            "Validation failed — e.g. `period` sent together with `from`/`to`, or `from` later than `to`.",
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { description: "No technician profile — onboarding is not complete." },
      },
    },
  },
  "/stats/technician/dashboard/recent-requests": {
    get: {
      tags: ["Stats"],
      summary: "Technician: five newest REQUESTED bookings",
      description: "The 'needs your response' table. Takes no query parameters.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Up to five pending job requests, newest first." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { description: "No technician profile — onboarding is not complete." },
      },
    },
  },
};
