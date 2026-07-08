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
    description: "All groups optional; each group's fields are individually optional (partial update).",
    properties: {
      basicInfo: { $ref: "#/components/schemas/TechnicianBasicInfo" },
      pricing: { $ref: "#/components/schemas/TechnicianPricing" },
      location: { $ref: "#/components/schemas/TechnicianLocation" },
    },
  },
};
