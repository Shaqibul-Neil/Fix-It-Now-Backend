export const authPaths = {
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a customer or technician",
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterBody" } } },
      },
      responses: {
        "201": { description: "Registered; returns the created user (no tokens — log in separately)." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "409": { $ref: "#/components/responses/Conflict" },
      },
    },
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login",
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/LoginBody" } } },
      },
      responses: {
        "200": { description: "Logged in; returns access token (refresh token set as cookie)." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/auth/refresh-token": {
    post: {
      tags: ["Auth"],
      summary: "Get a new access token from the refresh-token cookie",
      description: "Reads the httpOnly refresh-token cookie; no request body.",
      responses: {
        "200": { description: "New access token issued." },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Current authenticated user",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Current user." },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
};
