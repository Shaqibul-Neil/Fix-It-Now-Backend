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

const categoryIdParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
  description: "Category id.",
};

export const categoryPaths = {
  "/categories": {
    get: {
      tags: ["Categories"],
      summary: "Public: list live categories",
      description:
        "Switched-off and removed categories are never returned here — this is the customer-facing menu. " +
        "No paging: the list is short by design and the home screen shows all of it.",
      responses: {
        "200": {
          description: "Live categories, A-Z.",
          content: {
            "application/json": {
              schema: { type: "array", items: { $ref: "#/components/schemas/CategoryPublicItem" } },
            },
          },
        },
      },
    },
  },
  "/admin/categories": {
    get: {
      tags: ["Categories"],
      summary: "Admin: list categories (every state)",
      description:
        "One endpoint backs all four tabs of the admin category table — `status` picks which. " +
        "Omitting it returns only the live ones.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/RecordStatusParam" },
        { name: "search", in: "query", required: false, schema: { type: "string" }, description: "Matches the category name." },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": paginatedList("#/components/schemas/CategoryAdminItem", "Paginated categories, A-Z.", 11),
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
    post: {
      tags: ["Categories"],
      summary: "Admin: create category",
      description:
        "409 also fires when a **removed** category already holds the name — the message says so and asks for a " +
        "restore instead, because a second row with the same slug would be unreachable anyway.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryCreate" } } },
      },
      responses: {
        "201": { description: "Category created." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "409": { description: "Name or slug already taken, by a live or a removed category." },
      },
    },
  },
  "/admin/categories/{id}": {
    get: {
      tags: ["Categories"],
      summary: "Admin: category details",
      description: "Answers for removed categories too — that is how the restore screen reads one.",
      security: [{ bearerAuth: [] }],
      parameters: [categoryIdParam],
      responses: {
        "200": {
          description: "Category details.",
          content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryAdminItem" } } },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
    patch: {
      tags: ["Categories"],
      summary: "Admin: update category",
      description:
        "Renaming re-derives the slug and runs the same name check a create does. " +
        "Flipping `isActive` notifies every technician who had a live service under the category.",
      security: [{ bearerAuth: [] }],
      parameters: [categoryIdParam],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryUpdate" } } },
      },
      responses: {
        "200": { description: "Category updated." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "409": { description: "The new name or slug is already taken." },
      },
    },
    delete: {
      tags: ["Categories"],
      summary: "Admin: remove category (soft)",
      description:
        "Writes `deletedAt` only. `isActive` is left alone, so a category that was already switched off for the " +
        "season comes back switched off rather than going live the moment it is restored.\n\n" +
        "Nothing is erased and the services underneath are not touched — they simply stop appearing, because every " +
        "public read filters on a live category. The response carries `affectedServiceCount` so the admin sees what " +
        "just went dark.\n\n" +
        "Technicians are notified only when the removal is what actually took their services off the public list. " +
        "Removing a category that was already switched off tells them nothing they were not told already.",
      security: [{ bearerAuth: [] }],
      parameters: [categoryIdParam],
      responses: {
        "200": { description: "Category removed; `affectedServiceCount` included." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/admin/categories/{id}/restore": {
    patch: {
      tags: ["Categories"],
      summary: "Admin: restore a removed category",
      description:
        "Clears `deletedAt` and nothing else, so the category returns on whichever side of the `isActive` switch it " +
        "was left on. The services under it were never modified, so a category that comes back live brings them all " +
        "with it and the same technicians regain visibility.\n\n" +
        "A category that comes back still switched off puts nothing on the public list, so no technician is " +
        "notified — turning it on is a separate `PATCH /admin/categories/{id}`.",
      security: [{ bearerAuth: [] }],
      parameters: [categoryIdParam],
      responses: {
        "200": { description: "Category restored." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "409": { description: "This category is not removed." },
      },
    },
  },
};
