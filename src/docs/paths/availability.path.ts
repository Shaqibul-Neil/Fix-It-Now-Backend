export const availabilityPaths = {
  "/technician/availability": {
    put: {
      tags: ["Availability"],
      summary: "Technician: set (replace) weekly availability",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/SetAvailability" } } },
      },
      responses: {
        "200": { description: "Availability saved." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
    get: {
      tags: ["Availability"],
      summary: "Technician: get own availability",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Own availability slots." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
};
