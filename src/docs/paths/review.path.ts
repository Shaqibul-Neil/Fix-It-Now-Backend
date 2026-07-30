// Same shape for every paginated list in this file.
const paginatedList = (itemRef: string, description: string) => ({
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
              total: { type: "integer", example: 81 },
            },
          },
        },
      },
    },
  },
});

const ratingParam = {
  name: "rating",
  in: "query",
  required: false,
  schema: { type: "integer", minimum: 1, maximum: 5 },
};

const statusParam = {
  name: "status",
  in: "query",
  required: false,
  schema: { $ref: "#/components/schemas/ReviewStatus" },
};

export const reviewPaths = {
  "/reviews": {
    post: {
      tags: ["Reviews"],
      summary: "Customer: create a review for a completed booking",
      description:
        "Only for the caller's own booking, only once it is COMPLETED, and only once per booking. " +
        "Starts PENDING and does not affect the technician's rating until an admin publishes it.",
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
        "404": { $ref: "#/components/responses/NotFound" },
        "409": { description: "This booking already has a review." },
      },
    },
  },
  "/reviews/my-reviews": {
    get: {
      tags: ["Reviews"],
      summary: "Customer: own reviews",
      description:
        "Scoped to the caller's customer profile on the server — there is no query parameter that can widen it. " +
        "Each row names the technician and the job, so a review is identifiable without a second lookup.",
      security: [{ bearerAuth: [] }],
      parameters: [
        statusParam,
        ratingParam,
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": paginatedList("#/components/schemas/ReviewListItem", "Paginated own reviews, newest first."),
        "400": { $ref: "#/components/responses/ValidationError" },
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
      description: "The technician's rating is recomputed in the same transaction as the delete.",
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
  "/technician/reviews": {
    get: {
      tags: ["Reviews"],
      summary: "Technician: reviews written about me",
      description:
        "Scoped to the caller's technician profile on the server, so the dashboard does not have to fetch its own " +
        "profile id first.\n\n" +
        "PUBLISHED only — the same rows the public page shows. A PENDING review has not been through moderation and a " +
        "REJECTED one never will be; neither counts towards the rating, and neither is the technician's to read. " +
        "There is no `status` parameter for that reason.\n\n" +
        "Unlike the public route this does not require the profile to be APPROVED: a technician whose profile is " +
        "hidden can still read what was already published about them.",
      security: [{ bearerAuth: [] }],
      parameters: [
        ratingParam,
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": paginatedList("#/components/schemas/PublicReviewItem", "Paginated PUBLISHED reviews, newest first."),
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/technicians/{id}/reviews": {
    get: {
      tags: ["Reviews"],
      summary: "Public: PUBLISHED reviews for a technician",
      description:
        "PUBLISHED only, and only for a technician who is APPROVED and not banned — an unapproved profile's reviews " +
        "stay as invisible as the profile.\n\n" +
        "The technician is not repeated on each row; it is the `id` in the path. The reviewer is, because an unsigned " +
        "review carries no weight.",
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "TechnicianProfile id." },
        ratingParam,
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": paginatedList("#/components/schemas/PublicReviewItem", "Paginated PUBLISHED reviews, newest first."),
        "400": { $ref: "#/components/responses/ValidationError" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/admin/reviews": {
    get: {
      tags: ["Reviews"],
      summary: "Admin: list all reviews",
      description:
        "The moderation queue. Every row names who wrote it, who it is about and which job it was for — a rating with " +
        "no subject is nothing to decide on. Filter `status=PENDING` for the review backlog.",
      security: [{ bearerAuth: [] }],
      parameters: [
        statusParam,
        ratingParam,
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Matches either party's first name, last name or email, or the service title.",
        },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": paginatedList("#/components/schemas/AdminReviewItem", "Paginated reviews in every state, newest first."),
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/admin/reviews/{id}/status": {
    patch: {
      tags: ["Reviews"],
      summary: "Admin: moderate review status",
      description:
        "Recomputes the technician's rating in the same transaction, so a PUBLISHED review counts immediately and a " +
        "HIDDEN one stops counting. The customer and technician are notified only when it goes PUBLISHED.",
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
