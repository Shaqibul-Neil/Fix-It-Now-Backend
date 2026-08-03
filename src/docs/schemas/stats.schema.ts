export const statsSchemas = {
  StatMetric: {
    type: "object",
    description:
      "One KPI card. `changePercentage` is present on percentage-type metrics, " +
      "`changeValue` on value-type ones — both compare the selected window against the window before it.",
    properties: {
      id: { type: "string", example: "revenue" },
      label: { type: "string", example: "Total Revenue" },
      value: { type: "number", example: 148500 },
      changePercentage: { type: "number", nullable: true, example: 12.4 },
      changeValue: { type: "number", nullable: true, example: 18 },
    },
  },
  StatsTimePeriod: {
    type: "object",
    description: "The window the numbers were calculated over.",
    properties: {
      from: { type: "string", format: "date-time" },
      to: { type: "string", format: "date-time" },
    },
  },
  StatusBreakdownItem: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: [
          "REQUESTED",
          "ACCEPTED",
          "DECLINED",
          "PAID",
          "IN_PROGRESS",
          "COMPLETED",
          "CANCELLED",
        ],
      },
      count: { type: "integer", example: 34 },
    },
  },
  CategoryBreakdownItem: {
    type: "object",
    properties: {
      category: { type: "string", example: "Plumbing" },
      count: { type: "integer", example: 51 },
    },
  },
  TrendPoint: {
    type: "object",
    description: "One day of the trend line — the current window against the previous one.",
    properties: {
      date: { type: "string", example: "2026-07-14" },
      current: { type: "number", example: 12400 },
      previous: { type: "number", example: 9800 },
    },
  },
  AdminDashboard: {
    type: "object",
    properties: {
      timePeriod: { $ref: "#/components/schemas/StatsTimePeriod" },
      stats: {
        type: "array",
        description:
          "Five cards, in order: revenue, bookings, cancellation_rate, repeat_customer_rate, completed_bookings.",
        items: { $ref: "#/components/schemas/StatMetric" },
      },
      charts: {
        type: "object",
        properties: {
          bookingsByStatus: {
            type: "array",
            items: { $ref: "#/components/schemas/StatusBreakdownItem" },
          },
          bookingByCategory: {
            type: "array",
            items: { $ref: "#/components/schemas/CategoryBreakdownItem" },
          },
          revenueTrend: {
            type: "array",
            items: { $ref: "#/components/schemas/TrendPoint" },
          },
        },
      },
    },
  },
  CustomerStat: {
    type: "object",
    description:
      "One card on the customer dashboard. Deliberately has no `changeValue` or " +
      "`changePercentage`: a customer has no target to beat, so a period-over-period " +
      "delta would be noise. `href` is where the number leads — that link, not a " +
      "colour, is how an actionable card is signalled.",
    properties: {
      id: { type: "string", example: "maintenance_due" },
      label: { type: "string", example: "Maintenance Due" },
      value: { type: "integer", example: 1 },
      href: { type: "string", example: "/dashboard#maintenance" },
    },
  },
  MaintenanceItem: {
    type: "object",
    description:
      "One recurring category and where this customer stands in its cycle. " +
      "Nothing here is stored — `dueAt` and `daysLeft` are recomputed from the last " +
      "completed booking on every request, so no counter can drift and no cron is " +
      "needed. Only categories marked RECURRING with an interval ever appear; a " +
      "breakdown trade like fridge repair has no cycle and is excluded at the query.",
    properties: {
      categoryId: { type: "string", format: "uuid" },
      name: { type: "string", example: "AC Repair" },
      slug: { type: "string", example: "ac-repair" },
      image: { type: "string", nullable: true },
      lastServicedAt: {
        type: "string",
        format: "date-time",
        nullable: true,
        description: "Null when the customer has never booked this category.",
      },
      dueAt: { type: "string", format: "date-time", nullable: true },
      daysLeft: {
        type: "integer",
        nullable: true,
        example: -20,
        description: "Negative once the due date has passed. Null when never booked.",
      },
      status: {
        type: "string",
        enum: ["due", "soon", "never", "ok"],
        description:
          "`due` = daysLeft <= 0, `soon` = within 14 days, `never` = no booking " +
          "in this category yet (the upsell row), `ok` = nothing to do.",
      },
    },
  },
  ServiceMixSlice: {
    type: "object",
    description:
      "One slice of the 'services you use' chart, counted in jobs — never in money. " +
      "Percentages are not sent; the client divides by the total it already has.",
    properties: {
      categoryId: { type: "string", format: "uuid" },
      categoryName: { type: "string", example: "AC Repair" },
      count: { type: "integer", example: 8 },
    },
  },
  CustomerTechnician: {
    type: "object",
    description:
      "A technician this customer has actually worked with. `yourRating` is what " +
      "this customer gave them, not the technician's public average.",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", example: "Karim Mia" },
      avatar: { type: "string", nullable: true },
      professionalTitle: { type: "string", nullable: true },
      jobsTogether: { type: "integer", example: 3 },
      yourRating: {
        type: "number",
        nullable: true,
        example: 4.7,
        description: "Null when the customer has not reviewed any of those jobs.",
      },
    },
  },
  CustomerActiveBooking: {
    type: "object",
    description:
      "A booking that has not finished yet. The status stepper is drawn client-side " +
      "from `status` — the API sends state, not presentation.",
    properties: {
      id: { type: "string", format: "uuid" },
      status: {
        type: "string",
        enum: ["REQUESTED", "ACCEPTED", "PAID", "IN_PROGRESS"],
      },
      serviceTitle: { type: "string", example: "Split AC servicing" },
      categoryName: { type: "string", example: "AC Repair" },
      technicianName: { type: "string", example: "Karim Mia" },
      technicianAvatar: { type: "string", nullable: true },
      scheduledAt: { type: "string", format: "date-time" },
    },
  },
  CustomerDashboard: {
    type: "object",
    description:
      "Everything the customer dashboard renders, in one call. No period selector: " +
      "these are lifetime numbers and live state, not a windowed report. Contains no " +
      "spend or payment figures by design — a running total of what somebody has " +
      "spent reads as a bill and works against them coming back.",
    properties: {
      stats: {
        type: "array",
        description:
          "Five cards, in order: active_bookings, pending_reviews, completed_jobs, " +
          "your_technicians, maintenance_due.",
        items: { $ref: "#/components/schemas/CustomerStat" },
      },
      maintenance: {
        type: "array",
        description: "Sorted most overdue first; never-booked categories last.",
        items: { $ref: "#/components/schemas/MaintenanceItem" },
      },
      serviceMix: {
        type: "array",
        items: { $ref: "#/components/schemas/ServiceMixSlice" },
      },
      technicians: {
        type: "array",
        description: "Up to four, most jobs together first.",
        items: { $ref: "#/components/schemas/CustomerTechnician" },
      },
      activeBooking: {
        type: "object",
        properties: {
          total: { type: "integer", example: 4 },
          primary: {
            allOf: [{ $ref: "#/components/schemas/CustomerActiveBooking" }],
            nullable: true,
            description:
              "The soonest-scheduled live booking — the one that gets the stepper. " +
              "Null when nothing is in flight.",
          },
          others: {
            type: "array",
            description: "The remaining live bookings, also soonest first.",
            items: { $ref: "#/components/schemas/CustomerActiveBooking" },
          },
        },
      },
    },
  },
  TechnicianDashboard: {
    type: "object",
    properties: {
      timePeriod: { $ref: "#/components/schemas/StatsTimePeriod" },
      stats: {
        type: "array",
        description:
          "Five cards, in order: earnings, completed_jobs, completion_rate, new_requests, average_rating.",
        items: { $ref: "#/components/schemas/StatMetric" },
      },
      charts: {
        type: "object",
        properties: {
          jobsByStatus: {
            type: "array",
            items: { $ref: "#/components/schemas/StatusBreakdownItem" },
          },
          earningsTrend: {
            type: "array",
            description: "Already multiplied by the technician's revenue share.",
            items: { $ref: "#/components/schemas/TrendPoint" },
          },
        },
      },
    },
  },
};
