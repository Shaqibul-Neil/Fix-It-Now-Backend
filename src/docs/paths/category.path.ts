export const categoryPaths = {
  "/categories": {
    get: {
      tags: ["Categories"],
      summary: "Public: list active categories",
      responses: { "200": { description: "Category list." } },
    },
  },
  "/admin/categories": {
    post: {
      tags: ["Categories"],
      summary: "Admin: create category",
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
        "409": { $ref: "#/components/responses/Conflict" },
      },
    },
  },
  "/admin/categories/{id}": {
    patch: {
      tags: ["Categories"],
      summary: "Admin: update category",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
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
      },
    },
    delete: {
      tags: ["Categories"],
      summary: "Admin: delete category",
      description: "Restricted (409) if the category still has services.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": { description: "Category deleted." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "409": { $ref: "#/components/responses/Conflict" },
      },
    },
  },
};
