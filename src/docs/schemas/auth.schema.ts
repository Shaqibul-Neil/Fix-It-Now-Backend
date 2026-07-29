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
  CurrentUser: {
    type: "object",
    description:
      "Response of GET /auth/me. `approvalStatus` and `rejectionReason` are only present when role is TECHNICIAN — " +
      "for CUSTOMER and ADMIN the keys are absent, not null.",
    required: ["id", "firstName", "lastName", "email", "role", "status", "isOnboarded"],
    properties: {
      id: { type: "string", format: "uuid" },
      firstName: { type: "string", example: "Karim" },
      lastName: { type: "string", example: "Mia" },
      email: { type: "string", format: "email", example: "karim.tech@fixitnow.com" },
      role: { type: "string", enum: ["CUSTOMER", "TECHNICIAN", "ADMIN"] },
      status: { type: "string", enum: ["ACTIVE", "BANNED"] },
      isOnboarded: {
        type: "boolean",
        description:
          "Always true for CUSTOMER and ADMIN — they never onboard. For TECHNICIAN it is true once the profile form is submitted. " +
          "False means the frontend should redirect to /onboarding.",
        example: true,
      },
      approvalStatus: {
        allOf: [{ $ref: "#/components/schemas/TechnicianApprovalStatus" }],
        description:
          "TECHNICIAN only. Null while onboarding has not been submitted. " +
          "Drives the pending/rejected banner on the dashboard.",
        nullable: true,
      },
      rejectionReason: {
        type: "string",
        nullable: true,
        description: "TECHNICIAN only. The admin's reason, shown when approvalStatus is REJECTED.",
      },
    },
  },
};
