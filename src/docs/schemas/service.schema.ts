export const serviceSchemas = {
  ServiceCreate: {
    type: "object",
    required: ["categoryId", "title", "price"],
    properties: {
      categoryId: { type: "string", format: "uuid" },
      title: { type: "string", minLength: 3, maxLength: 150, example: "Pipe leak repair" },
      description: { type: "string", maxLength: 2000 },
      price: { type: "number", exclusiveMinimum: 0, example: 1200 },
      estimatedDuration: { type: "integer", exclusiveMinimum: 0, description: "Minutes.", example: 60 },
      isActive: { type: "boolean", default: true },
    },
  },
  ServiceUpdate: {
    type: "object",
    description: "Partial update.",
    properties: {
      categoryId: { type: "string", format: "uuid" },
      title: { type: "string", minLength: 3, maxLength: 150 },
      description: { type: "string", maxLength: 2000 },
      price: { type: "number", exclusiveMinimum: 0 },
      estimatedDuration: { type: "integer", exclusiveMinimum: 0 },
      isActive: { type: "boolean" },
    },
  },
};
