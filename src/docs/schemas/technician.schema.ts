export const technicianSchemas = {
  TechnicianBasicInfo: {
    type: "object",
    required: ["phone", "bio", "experienceYears"],
    properties: {
      phone: { type: "string", minLength: 6, maxLength: 11, example: "01710000001" },
      avatar: { type: "string", format: "uri", nullable: true },
      bio: { type: "string", minLength: 10, maxLength: 1000, example: "Licensed plumber, 8 years." },
      experienceYears: { type: "integer", minimum: 0, maximum: 60, example: 8 },
    },
  },
  TechnicianPricing: {
    type: "object",
    required: ["hourlyRate"],
    properties: {
      hourlyRate: { type: "number", exclusiveMinimum: 0, example: 500 },
      serviceRadius: { type: "integer", exclusiveMinimum: 0, nullable: true, example: 10 },
    },
  },
  TechnicianLocation: {
    type: "object",
    required: ["address", "city", "area"],
    properties: {
      address: { type: "string", minLength: 5, maxLength: 255, example: "House 12, Road 3" },
      city: { type: "string", minLength: 2, maxLength: 100, example: "Dhaka" },
      area: { type: "string", minLength: 2, maxLength: 100, example: "Gulshan" },
    },
  },
  TechnicianProfileCreate: {
    type: "object",
    required: ["basicInfo", "pricing", "location"],
    properties: {
      basicInfo: { $ref: "#/components/schemas/TechnicianBasicInfo" },
      pricing: { $ref: "#/components/schemas/TechnicianPricing" },
      location: { $ref: "#/components/schemas/TechnicianLocation" },
    },
  },
  TechnicianProfileUpdate: {
    type: "object",
    description:
      "All groups optional; each group's fields are individually optional (partial update). " +
      "Updating a REJECTED profile resets it to PENDING and puts it back in the admin review queue.",
    properties: {
      basicInfo: { $ref: "#/components/schemas/TechnicianBasicInfo" },
      pricing: { $ref: "#/components/schemas/TechnicianPricing" },
      location: { $ref: "#/components/schemas/TechnicianLocation" },
    },
  },
  TechnicianApprovalStatus: {
    type: "string",
    enum: ["PENDING", "APPROVED", "REJECTED"],
    description:
      "PENDING = submitted, waiting on an admin. APPROVED = publicly listed and allowed to publish services. " +
      "REJECTED = hidden from customers until the technician edits and resubmits.",
    example: "PENDING",
  },
  TechnicianReviewRequest: {
    type: "object",
    required: ["status"],
    description:
      "One endpoint handles both decisions — `status` picks which. " +
      "`rejectionReason` is required when status is REJECTED and ignored when it is APPROVED.",
    properties: {
      status: {
        type: "string",
        enum: ["APPROVED", "REJECTED"],
        description: "The admin's decision. PENDING is not accepted here.",
        example: "APPROVED",
      },
      rejectionReason: {
        type: "string",
        minLength: 10,
        maxLength: 500,
        nullable: true,
        description: "Required when status is REJECTED — the technician sees this text.",
        example: "Bio is too short and the phone number could not be verified.",
      },
    },
  },
  TechnicianAdminListItem: {
    type: "object",
    description: "One row of the admin technician table.",
    properties: {
      id: { type: "string", format: "uuid" },
      firstName: { type: "string", example: "Karim" },
      lastName: { type: "string", example: "Mia" },
      email: { type: "string", format: "email" },
      phone: { type: "string", example: "01710000001" },
      experienceYears: { type: "integer", example: 8 },
      hourlyRate: { type: "number", example: 500 },
      city: { type: "string", example: "Dhaka" },
      area: { type: "string", example: "Dhanmondi" },
      averageRating: { type: "number", example: 4.5 },
      totalReviews: { type: "integer", example: 12 },
      approvalStatus: { $ref: "#/components/schemas/TechnicianApprovalStatus" },
      rejectionReason: { type: "string", nullable: true },
      reviewedAt: { type: "string", format: "date-time", nullable: true },
      appliedAt: { type: "string", format: "date-time", description: "When the onboarding was submitted." },
      completedJobs: { type: "integer", example: 7 },
    },
  },
};
