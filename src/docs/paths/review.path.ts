const reviewStatusEnum = ["PENDING", "PUBLISHED", "HIDDEN", "REJECTED"];

export const reviewPaths = {
  "/reviews": {
    post: {
      tags: ["Reviews"],
      summary: "Customer: create a review for a completed booking",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewCreate" } } },
      },
      responses: {
        "201": { description: "Review created (status PENDING until moderated)." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/reviews/my-reviews": {
    get: {
      tags: ["Reviews"],
      summary: "Customer: own reviews",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "status", in: "query", required: false, schema: { type: "string", enum: reviewStatusEnum } },
        { name: "rating", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 5 } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated own reviews." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/reviews/{id}": {
    patch: {
      tags: ["Reviews"],
      summary: "Customer: update own review",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewUpdate" } } },
      },
      responses: {
        "200": { description: "Review updated." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
    delete: {
      tags: ["Reviews"],
      summary: "Customer (own) or Admin: delete review",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": { description: "Review deleted." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/technicians/{id}/reviews": {
    get: {
      tags: ["Reviews"],
      summary: "Public: PUBLISHED reviews for a technician",
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        { name: "rating", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 5 } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated PUBLISHED reviews only." },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/admin/reviews": {
    get: {
      tags: ["Reviews"],
      summary: "Admin: list all reviews",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "status", in: "query", required: false, schema: { type: "string", enum: reviewStatusEnum } },
        { name: "rating", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 5 } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated all reviews." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/admin/reviews/{id}/status": {
    patch: {
      tags: ["Reviews"],
      summary: "Admin: moderate review status",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewStatusUpdate" } } },
      },
      responses: {
        "200": { description: "Review status updated." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
};
