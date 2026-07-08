export const paymentSchemas = {
  PaymentCreate: {
    type: "object",
    required: ["bookingId"],
    properties: {
      bookingId: { type: "string", format: "uuid" },
    },
  },
};
