// Same shape for every slot list in this file.
const slotList = (itemRef: string, description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { type: "array", items: { $ref: itemRef } },
    },
  },
});

export const availabilityPaths = {
  "/technician/availability": {
    put: {
      tags: ["Availability"],
      summary: "Technician: set (replace) weekly availability",
      description:
        "Deletes the existing schedule and writes the submitted one in a single transaction, then notifies the admin. " +
        "Overlapping slots on the same day are rejected. Returns the saved schedule.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/SetAvailability" } } },
      },
      responses: {
        "200": slotList("#/components/schemas/OwnAvailabilitySlot", "The saved schedule."),
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { description: "No technician profile yet — finish onboarding first." },
      },
    },
    get: {
      tags: ["Availability"],
      summary: "Technician: get own availability",
      description:
        "Raw `startTime` / `endTime`, matching what the PUT accepts, so the edit form can prefill from this response directly.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": slotList("#/components/schemas/OwnAvailabilitySlot", "Own availability slots, inactive days included."),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { description: "No technician profile yet — finish onboarding first." },
      },
    },
  },
  "/technicians/{id}/availability": {
    get: {
      tags: ["Availability"],
      summary: "Public: a technician's bookable hours",
      description:
        "Backs the date/time step of the booking panel: disable the weekdays that are absent, and offer the day's " +
        "windows as the selectable times.\n\n" +
        "Read through the profile, so a PENDING, REJECTED or banned technician answers 404 exactly as `/technicians/{id}` does.\n\n" +
        "An empty array is a valid answer and means the technician published no schedule. The booking check skips " +
        "the availability rule entirely in that case, so the caller should fall back to an open time picker rather than blocking.",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "TechnicianProfile id." }],
      responses: {
        "200": slotList("#/components/schemas/PublicAvailabilitySlot", "Active slots, Monday first."),
        "400": { $ref: "#/components/responses/ValidationError" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
};
