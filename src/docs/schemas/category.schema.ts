export const categorySchemas = {
  CategoryCreate: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 100, example: "Plumbing" },
      slug: { type: "string", minLength: 2, maxLength: 120, description: "Derived from `name` when omitted.", example: "plumbing" },
      description: { type: "string", maxLength: 2000, example: "Pipe, leak, tap and fitting work" },
      image: {
        type: "string",
        format: "uri",
        maxLength: 2048,
        description: "Card artwork for the category. Any reachable image URL.",
        example: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80&auto=format&fit=crop",
      },
      isActive: { type: "boolean", default: true },
    },
  },
  CategoryUpdate: {
    type: "object",
    description: "Partial update. Send `image: null` to clear the picture.",
    properties: {
      name: { type: "string", minLength: 2, maxLength: 100 },
      description: { type: "string", maxLength: 2000 },
      image: { type: "string", format: "uri", maxLength: 2048, nullable: true },
      isActive: { type: "boolean" },
    },
  },
  CategoryPublicItem: {
    type: "object",
    description: "What customers see. Only live categories are ever returned here.",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", example: "Plumbing" },
      slug: { type: "string", example: "plumbing" },
      description: { type: "string", nullable: true },
      image: { type: "string", format: "uri", nullable: true },
    },
  },
  CategoryAdminItem: {
    allOf: [
      { $ref: "#/components/schemas/CategoryPublicItem" },
      {
        type: "object",
        description:
          "The public row plus both state flags, which move independently. `isActive: false` with " +
          "`isDeleted: false` is a category that was switched off — a toggle brings it back. `isDeleted: true` " +
          "needs the restore endpoint, and keeps whatever `isActive` it had, so a removed row can read " +
          "`isActive: true` and still be off the public list. Read `isDeleted` first.",
        properties: {
          isActive: { type: "boolean" },
          isDeleted: { type: "boolean" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          totalServices: {
            type: "integer",
            description: "Services still attached to this category, removed ones excluded.",
            example: 12,
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    ],
  },
};
