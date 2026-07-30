const TIME_PATTERN = "^([01]\\d|2[0-3]):([0-5]\\d)$";

export const availabilitySchemas = {
  DayOfWeek: {
    type: "string",
    enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
    description: "Slots are always returned in this order — Monday first, not alphabetical.",
    example: "MONDAY",
  },
  AvailabilitySlot: {
    type: "object",
    required: ["dayOfWeek", "startTime", "endTime"],
    description: "One weekly working window. `endTime` must be later than `startTime`, and two slots on the same day may not overlap.",
    properties: {
      dayOfWeek: { $ref: "#/components/schemas/DayOfWeek" },
      startTime: { type: "string", pattern: TIME_PATTERN, example: "09:00" },
      endTime: { type: "string", pattern: TIME_PATTERN, example: "17:00" },
      isActive: {
        type: "boolean",
        default: true,
        description:
          "A day kept in the schedule but not taking work — a holiday, not a deletion. " +
          "Inactive slots stay out of the public schedule and out of the booking check. Omit for a live slot.",
        example: true,
      },
    },
  },
  SetAvailability: {
    type: "object",
    required: ["slots"],
    description:
      "Replaces the technician's full weekly availability set — whatever is not in `slots` is deleted. " +
      "Send the complete schedule every time, not a delta.",
    properties: {
      slots: {
        type: "array",
        minItems: 1,
        maxItems: 50,
        items: { $ref: "#/components/schemas/AvailabilitySlot" },
      },
    },
  },
  OwnAvailabilitySlot: {
    type: "object",
    description:
      "A stored slot as the owning technician sees it. Inactive days are included — they are theirs to toggle back on. " +
      "`id` is regenerated on every save, since a save replaces the whole set.",
    properties: {
      id: { type: "string", format: "uuid" },
      dayOfWeek: { $ref: "#/components/schemas/DayOfWeek" },
      startTime: { type: "string", pattern: TIME_PATTERN, example: "09:00" },
      endTime: { type: "string", pattern: TIME_PATTERN, example: "17:00" },
      isActive: { type: "boolean", example: true },
    },
  },
  PublicAvailabilitySlot: {
    type: "object",
    description:
      "A bookable window. There is no `isActive` here — the switched-off days are already filtered out, so every slot returned is live.",
    properties: {
      id: { type: "string", format: "uuid" },
      dayOfWeek: { $ref: "#/components/schemas/DayOfWeek" },
      startTime: { type: "string", pattern: TIME_PATTERN, example: "09:00" },
      endTime: { type: "string", pattern: TIME_PATTERN, example: "17:00" },
    },
  },
};
