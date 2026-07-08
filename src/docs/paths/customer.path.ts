export const customerPaths = {
  "/customer/profile/me": {
    get: {
      tags: ["Customer"],
      summary: "Customer: get own profile",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Own customer profile." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/customer/profile": {
    patch: {
      tags: ["Customer"],
      summary: "Customer: update own profile",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerProfileUpdate" } } },
      },
      responses: {
        "200": { description: "Profile updated." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
};
