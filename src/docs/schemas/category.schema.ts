export const categorySchemas = {
  CategoryCreate: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 100, example: "Plumbing" },
      slug: { type: "string", minLength: 2, maxLength: 120, example: "plumbing" },
      description: { type: "string", maxLength: 2000 },
      isActive: { type: "boolean", default: true },
    },
  },
  CategoryUpdate: {
    type: "object",
    description: "Partial update.",
    properties: {
      name: { type: "string", minLength: 2, maxLength: 100 },
      description: { type: "string", maxLength: 2000 },
      isActive: { type: "boolean" },
    },
  },
};
