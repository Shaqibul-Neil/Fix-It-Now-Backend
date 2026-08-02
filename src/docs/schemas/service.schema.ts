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
      isActive: {
        type: "boolean",
        description:
          "The owner's on/off switch — this is what `?status=paused` reads. Turning a service off hides it from " +
          "customers but leaves it in the technician's own list, which is not the same thing as removing it. " +
          "Removing and restoring never touch this field, so a service comes back from the removed tab exactly as " +
          "on or off as it was left.",
      },
    },
  },
  ServiceRemovedBy: {
    type: "object",
    nullable: true,
    description:
      "Who pressed remove, and `null` while the service is still live. `role` is the field that matters: a " +
      "technician may undo their own removal, but a row an ADMIN removed can only be restored by an admin, so this " +
      "is what decides whether a restore button belongs on the screen at all.",
    properties: {
      name: { type: "string", example: "Karim Mia" },
      role: { type: "string", enum: ["TECHNICIAN", "ADMIN"], example: "ADMIN" },
    },
  },
};
