export const technicianPaths = {
  "/technicians/profile": {
    post: {
      tags: ["Technicians"],
      summary: "Create own technician profile",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/TechnicianProfileCreate" } } },
      },
      responses: {
        "201": { description: "Profile created." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
    patch: {
      tags: ["Technicians"],
      summary: "Update own technician profile",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/TechnicianProfileUpdate" } } },
      },
      responses: {
        "200": { description: "Profile updated." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/technicians/profile/me": {
    get: {
      tags: ["Technicians"],
      summary: "Get own technician profile",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Own technician profile." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/technicians": {
    get: {
      tags: ["Technicians"],
      summary: "Public: list technicians",
      parameters: [
        { name: "city", in: "query", required: false, schema: { type: "string" } },
        { name: "search", in: "query", required: false, schema: { type: "string" } },
        { name: "minRating", in: "query", required: false, schema: { type: "number", minimum: 1, maximum: 5 } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated technician list." },
        "400": { $ref: "#/components/responses/ValidationError" },
      },
    },
  },
  "/technicians/{id}": {
    get: {
      tags: ["Technicians"],
      summary: "Public: technician details",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": { description: "Technician details." },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
};
