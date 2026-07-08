export const customerSchemas = {
  CustomerProfileUpdate: {
    type: "object",
    description: "Partial update.",
    properties: {
      phone: { type: "string", maxLength: 20 },
      avatar: { type: "string" },
      defaultAddress: { type: "string" },
      city: { type: "string", maxLength: 100 },
      area: { type: "string", maxLength: 100 },
      postalCode: { type: "string", maxLength: 20 },
    },
  },
};
