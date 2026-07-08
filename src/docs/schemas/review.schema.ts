export const reviewSchemas = {
  ReviewCreate: {
    type: "object",
    required: ["bookingId", "rating"],
    properties: {
      bookingId: { type: "string", format: "uuid" },
      rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
      comment: { type: "string", maxLength: 2000 },
    },
  },
  ReviewUpdate: {
    type: "object",
    description: "Partial update (customer, own review).",
    properties: {
      rating: { type: "integer", minimum: 1, maximum: 5 },
      comment: { type: "string", maxLength: 2000 },
    },
  },
  ReviewStatusUpdate: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["PENDING", "PUBLISHED", "HIDDEN", "REJECTED"],
      },
    },
  },
};
