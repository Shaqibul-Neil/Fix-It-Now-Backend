export const adminPaths = {
  "/admin/users": {
    get: {
      tags: ["Admin"],
      summary: "Admin: list users",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "role", in: "query", required: false, schema: { type: "string", enum: ["CUSTOMER", "TECHNICIAN", "ADMIN"] } },
        { name: "status", in: "query", required: false, schema: { type: "string", enum: ["ACTIVE", "BANNED"] } },
        { name: "search", in: "query", required: false, schema: { type: "string" } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated users." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/admin/users/{id}": {
    patch: {
      tags: ["Admin"],
      summary: "Admin: ban/unban a user",
      description: "Admin cannot change own status or another admin's.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/UserStatusUpdate" } } },
      },
      responses: {
        "200": { description: "User status updated." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
};
