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
};

// Reusable error responses ($ref: #/components/responses/Unauthorized).
export const responses = {
  ValidationError: { description: "Validation failed (invalid body/query/params)." },
  Unauthorized: { description: "Missing or invalid access token." },
  Forbidden: { description: "Authenticated but role not allowed." },
  NotFound: { description: "Resource not found." },
  Conflict: { description: "Conflict (e.g. duplicate or restricted delete)." },
};
