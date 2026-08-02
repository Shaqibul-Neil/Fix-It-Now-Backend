export const reviewSchemas = {
  ReviewCreate: {
    type: "object",
    required: ["bookingId", "rating"],
    description:
      "One review per booking, and only once the booking is COMPLETED.",
    properties: {
      bookingId: { type: "string", format: "uuid" },
      rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
      comment: {
        type: "string",
        maxLength: 2000,
        description:
          "Sent as one string. A blank line (`\\n\\n`) starts a new paragraph — the public read endpoints split on " +
          "that and return an array.",
        example:
          "Arrived ten minutes early and left the bathroom cleaner than he found it.\n\nThe leak has not come back once in three weeks.",
      },
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
  ReviewStatus: {
    type: "string",
    enum: ["PENDING", "PUBLISHED", "HIDDEN", "REJECTED"],
    description:
      "PENDING = submitted, waiting on an admin — invisible to the public and not counted in the technician's rating. " +
      "PUBLISHED = live on the technician's page. HIDDEN = taken down after being published. REJECTED = refused at moderation.",
    example: "PUBLISHED",
  },
  ReviewStatusUpdate: {
    type: "object",
    required: ["status"],
    properties: {
      status: { $ref: "#/components/schemas/ReviewStatus" },
    },
  },
  ReviewParty: {
    type: "object",
    description:
      "A person on one side of the review. `id` is the profile id, not the User id.",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", example: "Nadia Akter" },
      avatar: {
        type: "string",
        nullable: true,
        description: "Profile picture URL. Fall back to initials when null.",
      },
    },
  },
  ReviewServiceRef: {
    type: "object",
    description: "The job the review is about.",
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string", example: "Emergency pipe leak repair" },
    },
  },
  ReviewListItem: {
    type: "object",
    description:
      "One row of the customer's own reviews. `status` is here because this is where the customer learns their " +
      "review is still waiting on an admin.",
    properties: {
      id: { type: "string", format: "uuid" },
      rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
      comment: { type: "string", nullable: true },
      status: { $ref: "#/components/schemas/ReviewStatus" },
      createdAt: { type: "string", format: "date-time" },
      bookingId: { type: "string", format: "uuid" },
      technician: { $ref: "#/components/schemas/ReviewParty" },
      service: { $ref: "#/components/schemas/ReviewServiceRef" },
    },
  },
  PublicReviewItem: {
    type: "object",
    description:
      "A published review on a technician's page. No `status` — the query only ever returns PUBLISHED, so the field " +
      "would be the same constant on every row. No reviewer email either.",
    properties: {
      id: { type: "string", format: "uuid" },
      rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
      comment: {
        type: "array",
        description:
          "One entry per paragraph, already split — render each as its own `<p>`. Empty array when the customer " +
          "left a rating and no words. The moderation row keeps `comment` as a raw string instead, because an admin " +
          "reads what was written, not a formatted card.",
        items: { type: "string" },
        example: [
          "Arrived ten minutes early and left the bathroom cleaner than he found it.",
          "The leak has not come back once in three weeks.",
        ],
      },
      createdAt: { type: "string", format: "date-time" },
      customer: { $ref: "#/components/schemas/ReviewParty" },
      service: { $ref: "#/components/schemas/ReviewServiceRef" },
    },
  },
  AdminReviewItem: {
    allOf: [
      { $ref: "#/components/schemas/ReviewListItem" },
      {
        type: "object",
        description:
          "The moderation row. Both parties carry an email, because settling a disputed review means being able to " +
          "reach either one.",
        properties: {
          updatedAt: {
            type: "string",
            format: "date-time",
            description:
              "Last write to the row. Equal to `createdAt` means untouched since submission; a gap means it was " +
              "either moderated or edited by the customer.",
          },
          technician: { $ref: "#/components/schemas/AdminReviewParty" },
          customer: { $ref: "#/components/schemas/AdminReviewParty" },
        },
      },
    ],
  },
  AdminReviewParty: {
    allOf: [
      { $ref: "#/components/schemas/ReviewParty" },
      {
        type: "object",
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "nadia.cust@fixitnow.com",
          },
        },
      },
    ],
  },
};
