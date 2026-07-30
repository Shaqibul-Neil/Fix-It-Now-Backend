export const paymentSchemas = {
  PaymentCreate: {
    type: "object",
    required: ["bookingId"],
    properties: {
      bookingId: { type: "string", format: "uuid" },
    },
  },
  PaymentStatus: {
    type: "string",
    enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
    description:
      "PENDING = gateway session opened, nothing settled yet. SUCCESS = validated against SSLCommerz and the booking moved to PAID. " +
      "FAILED = the gateway rejected, cancelled or expired the attempt. REFUNDED = money returned after a settled payment. " +
      "`paidAt`, `method` and `valId` are only ever set once a payment settles.",
    example: "SUCCESS",
  },
  PaymentProvider: {
    type: "string",
    enum: ["SSLCOMMERZ", "STRIPE"],
    description:
      "SSLCommerz is the only provider wired up; STRIPE exists on the model for rows imported from elsewhere and carries no `valId`.",
    example: "SSLCOMMERZ",
  },
  PaymentListItem: {
    type: "object",
    description:
      "One row of the customer's own payment history. The payer is the viewer, so no party details are attached.",
    properties: {
      id: { type: "string", format: "uuid" },
      status: { $ref: "#/components/schemas/PaymentStatus" },
      amount: { type: "string", description: "Decimal serialised as a string.", example: "1500.00" },
      provider: { $ref: "#/components/schemas/PaymentProvider" },
      method: { type: "string", nullable: true, description: "Card type or MFS wallet. Null until settled.", example: "VISA-CARD" },
      paidAt: { type: "string", format: "date-time", nullable: true, description: "Null unless the payment settled." },
      createdAt: { type: "string", format: "date-time", description: "When the payment attempt was opened." },
      bookingId: { type: "string", format: "uuid" },
      serviceTitle: { type: "string", example: "Emergency pipe leak repair" },
    },
  },
  PaymentAdminListItem: {
    type: "object",
    description:
      "One row of the admin payment table. Adds who paid, who gets paid, and the gateway transaction id — " +
      "an anonymous money row is useless for support and refunds.",
    properties: {
      id: { type: "string", format: "uuid" },
      status: { $ref: "#/components/schemas/PaymentStatus" },
      amount: { type: "string", description: "Decimal serialised as a string.", example: "1500.00" },
      provider: { $ref: "#/components/schemas/PaymentProvider" },
      method: { type: "string", nullable: true, example: "bKash" },
      transactionId: { type: "string", format: "uuid", description: "The tran_id sent to the gateway. Searchable." },
      paidAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      bookingId: { type: "string", format: "uuid" },
      bookingStatus: { type: "string", example: "COMPLETED", description: "Lets the admin spot a paid booking that never completed." },
      scheduledAt: { type: "string", format: "date-time" },
      serviceTitle: { type: "string", example: "Emergency pipe leak repair" },
      customer: {
        type: "object",
        description: "The payer.",
        properties: {
          id: { type: "string", format: "uuid", description: "CustomerProfile id." },
          name: { type: "string", example: "Nadia Akter" },
          email: { type: "string", format: "email", example: "nadia.cust@fixitnow.com" },
          phone: { type: "string", nullable: true, example: "01720000001" },
        },
      },
      technician: {
        type: "object",
        description: "Who the money is owed to.",
        properties: {
          id: { type: "string", format: "uuid", description: "TechnicianProfile id." },
          name: { type: "string", example: "Karim Mia" },
        },
      },
    },
  },
  PaymentDetails: {
    type: "object",
    description:
      "Full payment record with the job it settles. What a customer gets for their own payment.",
    properties: {
      id: { type: "string", format: "uuid" },
      transactionId: { type: "string", format: "uuid" },
      amount: { type: "string", example: "1500.00" },
      currency: { type: "string", example: "BDT", description: "Every amount on the platform is in this currency." },
      status: { $ref: "#/components/schemas/PaymentStatus" },
      provider: { $ref: "#/components/schemas/PaymentProvider" },
      method: { type: "string", nullable: true, example: "VISA-CARD" },
      paidAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time", description: "When the payment attempt was opened." },
      updatedAt: {
        type: "string",
        format: "date-time",
        description:
          "Last write to the row. On a REFUNDED payment the gap from `paidAt` is the only record of when the money went back.",
      },
      booking: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          status: { type: "string", example: "COMPLETED" },
          notes: { type: "string", nullable: true, example: "Please call before arriving." },
          address: { type: "string", example: "House 12, Road 3" },
          city: { type: "string", nullable: true, example: "Dhaka" },
          area: { type: "string", nullable: true, example: "Gulshan" },
          scheduledAt: { type: "string", format: "date-time" },
          acceptedAt: { type: "string", format: "date-time", nullable: true },
          completedAt: { type: "string", format: "date-time", nullable: true },
          cancelledAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      service: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", example: "Emergency pipe leak repair" },
          price: { type: "string", description: "Catalogue price. May differ from `amount` if the job was re-quoted.", example: "1500.00" },
          category: { type: "string", example: "Plumbing" },
        },
      },
      technician: {
        type: "object",
        description: "Who the money is owed to.",
        properties: {
          id: { type: "string", format: "uuid", description: "TechnicianProfile id." },
          name: { type: "string", example: "Karim Mia" },
        },
      },
    },
  },
  PaymentAdminDetails: {
    allOf: [
      { $ref: "#/components/schemas/PaymentDetails" },
      {
        type: "object",
        description: "Everything the customer sees, plus what moderation needs.",
        properties: {
          valId: {
            type: "string",
            nullable: true,
            description:
              "SSLCommerz's own validation id — what a disputed charge is reconciled with. Null until settled, and always null on a STRIPE row.",
            example: "260708123821wzqN0I5I6NPGFGi",
          },
          customer: {
            type: "object",
            description: "The payer.",
            properties: {
              id: { type: "string", format: "uuid", description: "CustomerProfile id." },
              name: { type: "string", example: "Nadia Akter" },
              email: { type: "string", format: "email", example: "nadia.cust@fixitnow.com" },
              phone: { type: "string", nullable: true, example: "01720000001" },
            },
          },
        },
      },
    ],
  },
};
