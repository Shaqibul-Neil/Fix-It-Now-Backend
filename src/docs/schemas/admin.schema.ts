export const adminSchemas = {
  UserStatusUpdate: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["ACTIVE", "BANNED"],
        description: "Admin cannot ban self or another admin.",
      },
    },
  },
};
