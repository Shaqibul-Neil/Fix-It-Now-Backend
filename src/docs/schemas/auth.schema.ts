export const authSchemas = {
  RegisterBody: {
    type: "object",
    required: ["firstName", "lastName", "email", "password"],
    properties: {
      firstName: { type: "string", maxLength: 50, example: "Nadia" },
      lastName: { type: "string", maxLength: 50, example: "Akter" },
      role: {
        type: "string",
        enum: ["CUSTOMER", "TECHNICIAN"],
        default: "CUSTOMER",
        description: "ADMIN cannot self-register.",
      },
      email: { type: "string", format: "email", example: "nadia.cust@fixitnow.com" },
      password: {
        type: "string",
        minLength: 6,
        description: "Min 6 chars, at least 1 uppercase, 1 lowercase, 1 number.",
        example: "Password123!",
      },
    },
  },
  LoginBody: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", example: "admin@fixitnow.com" },
      password: { type: "string", example: "Password123!" },
    },
  },
};
