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
