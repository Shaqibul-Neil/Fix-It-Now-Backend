export const authPaths = {
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a customer or technician",
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterBody" } } },
      },
      responses: {
        "201": { description: "Registered; returns the created user (no tokens — log in separately)." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "409": { $ref: "#/components/responses/Conflict" },
      },
    },
  },
  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login",
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/LoginBody" } } },
      },
      responses: {
        "200": { description: "Logged in; returns access token (refresh token set as cookie)." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/auth/refresh-token": {
    post: {
      tags: ["Auth"],
      summary: "Get a new access token from the refresh-token cookie",
      description: "Reads the httpOnly refresh-token cookie; no request body.",
      responses: {
        "200": { description: "New access token issued." },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Current authenticated user + onboarding state",
      description:
        "The frontend calls this on load to decide between the dashboard and the /onboarding redirect. " +
        "Technicians additionally get their approval state so the pending/rejected banner can render.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Current user.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CurrentUser" },
              examples: {
                technicianPending: {
                  summary: "Technician awaiting approval",
                  value: {
                    id: "3f1c...",
                    firstName: "Alamgir",
                    lastName: "Kabir",
                    email: "alamgir20.tech@fixitnow.com",
                    role: "TECHNICIAN",
                    status: "ACTIVE",
                    isOnboarded: true,
                    approvalStatus: "PENDING",
                    rejectionReason: null,
                  },
                },
                technicianNotOnboarded: {
                  summary: "Technician who has not submitted the form",
                  value: {
                    id: "8b22...",
                    firstName: "New",
                    lastName: "Tech",
                    email: "new.tech@fixitnow.com",
                    role: "TECHNICIAN",
                    status: "ACTIVE",
                    isOnboarded: false,
                    approvalStatus: null,
                    rejectionReason: null,
                  },
                },
                customer: {
                  summary: "Customer — no approval keys at all",
                  value: {
                    id: "a904...",
                    firstName: "Nadia",
                    lastName: "Akter",
                    email: "nadia.cust@fixitnow.com",
                    role: "CUSTOMER",
                    status: "ACTIVE",
                    isOnboarded: true,
                  },
                },
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
};
