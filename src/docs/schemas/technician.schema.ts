export const technicianSchemas = {
  TechnicianBasicInfo: {
    type: "object",
    required: ["phone", "bio", "experienceYears"],
    properties: {
      phone: { type: "string", minLength: 6, maxLength: 11, example: "01710000001" },
      avatar: { type: "string", format: "uri", maxLength: 2048, nullable: true },
      bio: {
        type: "string",
        minLength: 10,
        maxLength: 1000,
        description:
          "Sent as one string. Separate paragraphs with a blank line (`\\n\\n`) — the read endpoints split on that " +
          "and hand the profile page an array, so the write side stays a plain textarea and search still works.",
        example:
          "8 years of hands-on plumbing work across Dhaka. I take both quick call-outs and full-day jobs.\n\nYou get a fixed quote before I start, and that is the number you pay.",
      },
      experienceYears: { type: "integer", minimum: 0, maximum: 60, example: 8 },
    },
  },
  TechnicianAvailabilityUpdate: {
    type: "object",
    required: ["isAvailable"],
    description:
      "The technician's own \"am I taking work right now\" switch. Deliberately not part of the profile update: " +
      "that one is the onboarding form and an admin reviews its fields, while this is flipped several times a week " +
      "and reviewed by nobody.\n\n" +
      "Do not confuse it with the weekly schedule under `/technician/availability` — that one says *which hours* " +
      "they work, this one says *whether they are working at all*.",
    properties: {
      isAvailable: { type: "boolean", example: false },
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
      avatar: { type: "string", format: "uri", nullable: true, example: "https://randomuser.me/api/portraits/men/20.jpg" },
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
        description:
          "The public row plus the approval state, contact details and completed-job count.\n\n" +
          "`approvalStatus`, `accountStatus` and `isDeleted` are three independent axes and none of them implies " +
          "another: an APPROVED technician can be banned, and a banned one can also be removed. `userId` is the " +
          "handle for the ban and remove endpoints under `/admin/users` — `id` is the profile, not the account.",
        properties: {
          userId: { type: "string", format: "uuid", description: "User id — what /admin/users/{id} takes." },
          phone: { type: "string", example: "01710000001" },
          approvalStatus: { $ref: "#/components/schemas/TechnicianApprovalStatus" },
          rejectionReason: { type: "string", nullable: true },
          reviewedAt: { type: "string", format: "date-time", nullable: true },
          appliedAt: { type: "string", format: "date-time", description: "When the onboarding was submitted." },
          completedJobs: { type: "integer", example: 7 },
          accountStatus: { type: "string", enum: ["ACTIVE", "BANNED"], example: "ACTIVE" },
          isDeleted: { type: "boolean", description: "The account was removed by an admin.", example: false },
        },
      },
    ],
  },
  TechnicianServiceCard: {
    type: "object",
    description: "One service the technician offers. Switched-off and removed services are left out.",
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string", example: "Emergency pipe leak repair" },
      price: { type: "string", description: "Decimal serialised as a string.", example: "1500.00" },
      category: { type: "string", example: "Plumbing" },
    },
  },
  TechnicianAdminServiceCard: {
    allOf: [
      { $ref: "#/components/schemas/TechnicianServiceCard" },
      {
        type: "object",
        description:
          "The admin view keeps every service, switched-off and removed included — moderating a technician means " +
          "seeing what they took down, not just what is live. These two flags say which is which.",
        properties: {
          isActive: { type: "boolean" },
          isDeleted: { type: "boolean" },
        },
      },
    ],
  },
  TechnicianDetails: {
    type: "object",
    description:
      "The public profile page in one response — the technician, what they sell, what customers said, and when they work. " +
      "The last 20 published reviews only.\n\n" +
      "No `approvalStatus` or `rejectionReason` here: the query already pins APPROVED, so the first would be the same " +
      "constant on every row and the second always null. Moderation state is not the customer's business — the admin " +
      "detail route carries it.",
    properties: {
      id: { type: "string", format: "uuid", description: "TechnicianProfile id." },
      firstName: { type: "string", example: "Karim" },
      lastName: { type: "string", example: "Mia" },
      email: { type: "string", format: "email" },
      avatar: { type: "string", format: "uri", nullable: true },
      bio: {
        type: "array",
        description:
          "One entry per paragraph, already split — render each as its own `<p>`. Empty array when no bio was " +
          "written. It is stored as a single Text column and only split on the way out, so `?search=` still matches " +
          "across the whole thing.",
        items: { type: "string" },
        example: [
          "8 years of hands-on plumbing work across Dhaka. I take both quick call-outs and full-day jobs.",
          "You get a fixed quote before I start, and that is the number you pay.",
        ],
      },
      experienceYears: { type: "integer", example: 8 },
      hourlyRate: { type: "number", example: 500 },
      serviceRadius: { type: "integer", nullable: true, description: "Kilometres the technician travels.", example: 10 },
      city: { type: "string", example: "Dhaka" },
      area: { type: "string", example: "Dhanmondi" },
      averageRating: { type: "number", example: 4.5 },
      totalReviews: { type: "integer", example: 12 },
      services: { type: "array", items: { $ref: "#/components/schemas/TechnicianServiceCard" } },
      reviews: {
        type: "array",
        description:
          "The 20 most recent PUBLISHED reviews — the same row `GET /technicians/{id}/reviews` serves, so a page can " +
          "show these and switch to the paginated endpoint for the rest without changing its rendering.",
        items: { $ref: "#/components/schemas/PublicReviewItem" },
      },
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
        description:
          "The same payload read with no approval filter, plus everything the public version deliberately leaves " +
          "out: the moderation decision, the account state, the contact number, and the full service list with the " +
          "switched-off and removed rows still in it.",
        properties: {
          userId: { type: "string", format: "uuid", description: "User id — what /admin/users/{id} takes." },
          phone: { type: "string", example: "01710000001" },
          approvalStatus: { $ref: "#/components/schemas/TechnicianApprovalStatus" },
          rejectionReason: { type: "string", nullable: true },
          reviewedAt: { type: "string", format: "date-time", nullable: true },
          appliedAt: { type: "string", format: "date-time", description: "When the onboarding was submitted." },
          accountStatus: { type: "string", enum: ["ACTIVE", "BANNED"], example: "ACTIVE" },
          isDeleted: { type: "boolean", example: false },
          services: {
            type: "array",
            description: "Every service, removed ones included — overrides the public list.",
            items: { $ref: "#/components/schemas/TechnicianAdminServiceCard" },
          },
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
