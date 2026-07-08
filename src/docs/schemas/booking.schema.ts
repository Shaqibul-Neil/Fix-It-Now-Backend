export const bookingSchemas = {
  BookingCreate: {
    type: "object",
    required: ["serviceId", "scheduledAt", "address"],
    properties: {
      serviceId: { type: "string", format: "uuid" },
      scheduledAt: { type: "string", format: "date-time", description: "Must be in the future." },
      address: { type: "string", minLength: 1, maxLength: 500, example: "House 12, Road 3" },
      city: { type: "string", maxLength: 100, example: "Dhaka" },
      area: { type: "string", maxLength: 100, example: "Gulshan" },
      notes: { type: "string", maxLength: 2000 },
    },
  },
  BookingStatusUpdate: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"],
        description: "Technician transitions only.",
      },
      note: { type: "string", maxLength: 500 },
    },
  },
};
