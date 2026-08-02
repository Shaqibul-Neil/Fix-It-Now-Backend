// Reusable OpenAPI components shared across every path/schema module:
// the bearer security scheme, pagination query params, and error responses.

export const securitySchemes = {
  bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
};

// Reusable pagination query params ($ref: #/components/parameters/PageParam).
export const parameters = {
  PageParam: {
    name: "page",
    in: "query",
    required: false,
    schema: { type: "integer", minimum: 1, example: 1 },
    description: "Page number (1-based).",
  },
  LimitParam: {
    name: "limit",
    in: "query",
    required: false,
    schema: { type: "integer", minimum: 1, maximum: 100, example: 10 },
    description: "Items per page (max 100).",
  },
  // Services and categories both carry two independent flags — isActive (the
  // owner's on/off switch) and deletedAt (removed). One tab parameter reads both
  // so a list screen never has to combine them itself.
  RecordStatusParam: {
    name: "status",
    in: "query",
    required: false,
    schema: {
      type: "string",
      enum: ["active", "paused", "deleted", "all"],
      example: "active",
    },
    description:
      "Which shelf to read.\n\n" +
      "- `active` — switched on and not removed. **This is the default when the parameter is omitted.**\n" +
      "- `paused` — switched off by its owner, still present and one toggle from live.\n" +
      "- `deleted` — removed rows only. A removed row keeps whatever `isActive` it had, so restoring it " +
      "puts it back the way it was found — a paused service comes back paused, a live one comes back live.\n" +
      "- `all` — everything, removed rows included.",
  },
  // Users are removed but never switched off, so one boolean is enough here.
  IncludeDeletedParam: {
    name: "includeDeleted",
    in: "query",
    required: false,
    schema: { type: "string", enum: ["true", "false"], example: "false" },
    description:
      "Omit or send `false` to hide removed accounts. Send `true` to list them alongside the live ones — " +
      "each row carries `isDeleted` so the two are still tellable apart.",
  },
};

// Reusable error responses ($ref: #/components/responses/Unauthorized).
export const responses = {
  ValidationError: { description: "Validation failed (invalid body/query/params)." },
  Unauthorized: { description: "Missing or invalid access token." },
  Forbidden: { description: "Authenticated but role not allowed." },
  NotFound: { description: "Resource not found." },
  Conflict: { description: "Conflict (e.g. duplicate or restricted delete)." },
};
