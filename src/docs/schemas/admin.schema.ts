export const adminSchemas = {
  UserStatusUpdate: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["ACTIVE", "BANNED"],
        description:
          "Whether the account is allowed to sign in. An admin cannot change their own status or another " +
          "admin's, and sending the value the account already has is rejected.",
        example: "BANNED",
      },
    },
  },
  AdminUserItem: {
    type: "object",
    description:
      "One row of the admin user table. `status` and `isDeleted` are independent: BANNED with `isDeleted: false` " +
      "is an account that misbehaved and is still listed, while ACTIVE with `isDeleted: true` is one that was " +
      "removed without ever being in trouble.",
    properties: {
      id: { type: "string", format: "uuid", description: "User id — what the ban/remove/restore endpoints take." },
      firstName: { type: "string", example: "Nadia" },
      lastName: { type: "string", example: "Akter" },
      email: { type: "string", format: "email", example: "nadia.cust@fixitnow.com" },
      role: { type: "string", enum: ["CUSTOMER", "TECHNICIAN", "ADMIN"], example: "CUSTOMER" },
      status: { type: "string", enum: ["ACTIVE", "BANNED"], example: "ACTIVE" },
      isDeleted: { type: "boolean", example: false },
      deletedAt: { type: "string", format: "date-time", nullable: true },
      avatar: {
        type: "string",
        format: "uri",
        nullable: true,
        description: "Taken from whichever profile the account has — customer or technician.",
        example: "https://randomuser.me/api/portraits/women/4.jpg",
      },
      totalBookings: {
        type: "integer",
        description: "Bookings this account placed. Always 0 for a technician or an admin — only customers place them.",
        example: 6,
      },
      lastLoginAt: { type: "string", format: "date-time", nullable: true, description: "Null for an account that cannot sign in." },
      createdAt: { type: "string", format: "date-time" },
    },
  },
};
