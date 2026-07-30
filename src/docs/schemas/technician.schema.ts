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
  TechnicianListItem: {
    type: "object",
    description: "One row of the public technician list. `id` is the TechnicianProfile id, not the User id.",
    properties: {
      id: { type: "string", format: "uuid" },
      firstName: { type: "string", example: "Karim" },
      lastName: { type: "string", example: "Mia" },
      email: { type: "string", format: "email" },
      experienceYears: { type: "integer", example: 8 },
      hourlyRate: { type: "number", example: 500 },
      city: { type: "string", example: "Dhaka" },
      area: { type: "string", example: "Dhanmondi" },
      averageRating: { type: "number", example: 4.5 },
      totalReviews: { type: "integer", example: 12 },
    },
  },
  TechnicianAdminListItem: {
    allOf: [
      { $ref: "#/components/schemas/TechnicianListItem" },
      {
        type: "object",
        description: "The public row plus the approval state, contact details and completed-job count.",
        properties: {
          phone: { type: "string", example: "01710000001" },
          approvalStatus: { $ref: "#/components/schemas/TechnicianApprovalStatus" },
          rejectionReason: { type: "string", nullable: true },
          reviewedAt: { type: "string", format: "date-time", nullable: true },
          appliedAt: { type: "string", format: "date-time", description: "When the onboarding was submitted." },
          completedJobs: { type: "integer", example: 7 },
        },
      },
    ],
  },
  TechnicianServiceCard: {
    type: "object",
    description: "One service the technician offers. Switched-off services are left out.",
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string", example: "Emergency pipe leak repair" },
      price: { type: "string", description: "Decimal serialised as a string.", example: "1500.00" },
      category: { type: "string", example: "Plumbing" },
    },
  },
  TechnicianReviewCard: {
    type: "object",
    description: "One published review. Pending, hidden and rejected reviews never appear here.",
    properties: {
      id: { type: "string", format: "uuid" },
      rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
      comment: { type: "string", nullable: true, example: "Fixed it in under an hour." },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  TechnicianDetails: {
    type: "object",
    description:
      "The public profile page in one response — the technician, what they sell, what customers said, and when they work. " +
      "The last 20 published reviews only.",
    properties: {
      id: { type: "string", format: "uuid", description: "TechnicianProfile id." },
      firstName: { type: "string", example: "Karim" },
      lastName: { type: "string", example: "Mia" },
      bio: { type: "string", nullable: true, example: "Licensed plumber, 8 years." },
      experienceYears: { type: "integer", example: 8 },
      hourlyRate: { type: "number", example: 500 },
      serviceRadius: { type: "integer", nullable: true, description: "Kilometres the technician travels.", example: 10 },
      city: { type: "string", example: "Dhaka" },
      area: { type: "string", example: "Dhanmondi" },
      averageRating: { type: "number", example: 4.5 },
      totalReviews: { type: "integer", example: 12 },
      approvalStatus: { $ref: "#/components/schemas/TechnicianApprovalStatus" },
      rejectionReason: { type: "string", nullable: true },
      services: { type: "array", items: { $ref: "#/components/schemas/TechnicianServiceCard" } },
      reviews: { type: "array", items: { $ref: "#/components/schemas/TechnicianReviewCard" } },
      availability: {
        type: "array",
        description:
          "The weekly schedule, so the profile page can answer \"when can I get them\" without a second request. " +
          "Empty means no schedule published, which blocks nothing — see `GET /technicians/{id}/availability`.",
        items: { $ref: "#/components/schemas/PublicAvailabilitySlot" },
      },
    },
  },
  TechnicianAdminDetails: {
    allOf: [
      { $ref: "#/components/schemas/TechnicianDetails" },
      {
        type: "object",
        description: "The same payload with no approval filter, plus the booking counts.",
        properties: {
          bookingsByStatus: {
            type: "array",
            description: "Every status is present, zero-filled.",
            items: { $ref: "#/components/schemas/StatusBreakdownItem" },
          },
        },
      },
    ],
  },
};
