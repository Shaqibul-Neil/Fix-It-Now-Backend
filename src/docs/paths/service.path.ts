export const servicePaths = {
  "/services": {
    get: {
      tags: ["Services"],
      summary: "Public: list services",
      parameters: [
        { name: "category", in: "query", required: false, schema: { type: "string" }, description: "Category slug." },
        { name: "city", in: "query", required: false, schema: { type: "string" } },
        { name: "area", in: "query", required: false, schema: { type: "string" } },
        { name: "minRating", in: "query", required: false, schema: { type: "number", minimum: 0, maximum: 5 } },
        { name: "search", in: "query", required: false, schema: { type: "string" } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated service list." },
        "400": { $ref: "#/components/responses/ValidationError" },
      },
    },
    post: {
      tags: ["Services"],
      summary: "Technician: create a service",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/ServiceCreate" } } },
      },
      responses: {
        "201": { description: "Service created." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/technician/services/my-services": {
    get: {
      tags: ["Services"],
      summary: "Technician: own services",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Own services." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/services/{id}": {
    patch: {
      tags: ["Services"],
      summary: "Technician: update own service",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/ServiceUpdate" } } },
      },
      responses: {
        "200": { description: "Service updated." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
    delete: {
      tags: ["Services"],
      summary: "Technician (own) or Admin: delete service",
      description: "Restricted (409) if the service has bookings.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": { description: "Service deleted." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
        "409": { $ref: "#/components/responses/Conflict" },
      },
    },
  },
};
