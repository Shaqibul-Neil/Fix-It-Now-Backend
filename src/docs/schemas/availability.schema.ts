export const availabilitySchemas = {
  AvailabilitySlot: {
    type: "object",
    required: ["dayOfWeek", "startTime", "endTime"],
    properties: {
      dayOfWeek: {
        type: "string",
        enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
      },
      startTime: { type: "string", pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$", example: "09:00" },
      endTime: { type: "string", pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$", example: "17:00" },
    },
  },
  SetAvailability: {
    type: "object",
    required: ["slots"],
    description: "Replaces the technician's full weekly availability set.",
    properties: {
      slots: {
        type: "array",
        minItems: 1,
        maxItems: 50,
        items: { $ref: "#/components/schemas/AvailabilitySlot" },
      },
    },
  },
};
