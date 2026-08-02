const userIdParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
  description: "User id — not a customer or technician profile id.",
};

// Every write here runs the same guard first, so the same three answers apply.
const managedUserResponses = {
  "400": { description: "The admin tried to act on their own account." },
  "401": { $ref: "#/components/responses/Unauthorized" },
  "403": { description: "The target is another admin — admin accounts are not managed here." },
  "404": { $ref: "#/components/responses/NotFound" },
};

export const adminPaths = {
  "/admin/users": {
    get: {
      tags: ["Admin"],
      summary: "Admin: list users",
      description:
        "Every account in one table, technicians included. `status` and `includeDeleted` read two different " +
        "columns — a ban says the account misbehaved, a removal says it should no longer appear — so a row can " +
        "carry either, both, or neither.\n\n" +
        "This is the only place an account is banned or removed. The technician list at `/technicians/admin/list` " +
        "shows the same accounts through a trade lens but is read-only; its `userId` field is the handle back here.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "role", in: "query", required: false, schema: { type: "string", enum: ["CUSTOMER", "TECHNICIAN", "ADMIN"] } },
        { name: "status", in: "query", required: false, schema: { type: "string", enum: ["ACTIVE", "BANNED"] } },
        { $ref: "#/components/parameters/IncludeDeletedParam" },
        { name: "search", in: "query", required: false, schema: { type: "string" }, description: "Matches first name, last name or email." },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": {
          description: "Paginated users, newest first.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  items: { type: "array", items: { $ref: "#/components/schemas/AdminUserItem" } },
                  meta: {
                    type: "object",
                    properties: {
                      page: { type: "integer", example: 1 },
                      limit: { type: "integer", example: 10 },
                      total: { type: "integer", example: 92 },
                    },
                  },
                },
              },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/admin/users/{id}": {
    patch: {
      tags: ["Admin"],
      summary: "Admin: ban or reactivate a user",
      description:
        "Writes `status` only. A removed account is refused with a 409 — restore it first, because changing the " +
        "status of something that is not supposed to exist answers no question anyone asked.\n\n" +
        "Reactivating notifies the user; banning is recorded for the admins only, since a banned user cannot read " +
        "anything anyway.",
      security: [{ bearerAuth: [] }],
      parameters: [userIdParam],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/UserStatusUpdate" } } },
      },
      responses: {
        "200": { description: "User status updated." },
        ...managedUserResponses,
        "409": { description: "The account is removed — restore it before changing its status." },
      },
    },
    delete: {
      tags: ["Admin"],
      summary: "Admin: remove a user (soft)",
      description:
        "Writes `deletedAt` and nothing else. The status column is deliberately left alone: a ban and a removal " +
        "answer two different questions, and writing one over the other loses the answer to the first.\n\n" +
        "The account can no longer sign in — authenticate, login and refresh all check `deletedAt` — but every " +
        "booking, review and payment it left behind stays exactly where it is.",
      security: [{ bearerAuth: [] }],
      parameters: [userIdParam],
      responses: {
        "200": { description: "Account removed." },
        ...managedUserResponses,
        "409": { description: "This account is already removed." },
      },
    },
  },
  "/admin/users/{id}/restore": {
    patch: {
      tags: ["Admin"],
      summary: "Admin: restore a removed user",
      description:
        "Clears `deletedAt`. The account comes back exactly as it was left — someone who was banned before being " +
        "removed is still banned after the restore, and lifting that ban is a separate decision taken on the " +
        "status endpoint.\n\n" +
        "For the same reason the user is only notified when the restore actually leaves them able to sign in.",
      security: [{ bearerAuth: [] }],
      parameters: [userIdParam],
      responses: {
        "200": { description: "Account restored." },
        ...managedUserResponses,
        "409": { description: "This account is not removed." },
      },
    },
  },
};
