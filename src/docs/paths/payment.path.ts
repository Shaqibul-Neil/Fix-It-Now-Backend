const paymentStatusEnum = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"];

// Same shape for every paginated list in this file.
const paginatedList = (itemRef: string, description: string) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          items: { type: "array", items: { $ref: itemRef } },
          meta: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 10 },
              total: { type: "integer", example: 137 },
            },
          },
        },
      },
    },
  },
});

export const paymentPaths = {
  "/payments/create": {
    post: {
      tags: ["Payments"],
      summary: "Customer: start SSLCommerz payment session",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentCreate" } } },
      },
      responses: {
        "201": { description: "Payment session created; returns SSLCommerz gateway redirect URL." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/payments/my-payments": {
    get: {
      tags: ["Payments"],
      summary: "Customer: own payment history",
      description:
        "Scoped to the caller's customer profile on the server — there is no query parameter that can widen it.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "status", in: "query", required: false, schema: { type: "string", enum: paymentStatusEnum } },
        { name: "period", in: "query", required: false, schema: { type: "integer" }, description: "Trailing days window." },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": paginatedList("#/components/schemas/PaymentListItem", "Paginated payments."),
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/payments/{id}": {
    get: {
      tags: ["Payments"],
      summary: "Customer (own) or Admin: payment details",
      description:
        "A customer is filtered down to their own payments, so someone else's id returns 404 rather than 403 — " +
        "the endpoint never confirms that a payment it will not show exists. An admin is not filtered, and gets " +
        "the payer and the gateway `valId` on top.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": {
          description: "Payment details — the admin variant carries the extra moderation fields.",
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/PaymentDetails" },
                  { $ref: "#/components/schemas/PaymentAdminDetails" },
                ],
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/admin/payments": {
    get: {
      tags: ["Payments"],
      summary: "Admin: list all payments",
      description:
        "Every payment in the system, carrying the payer, the technician owed the money, and the gateway " +
        "transaction id. The customer's own history omits all three — there the payer is the viewer.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "status", in: "query", required: false, schema: { type: "string", enum: paymentStatusEnum } },
        { name: "period", in: "query", required: false, schema: { type: "integer" }, description: "Trailing days window." },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Matches the transaction id, or the payer's first name, last name or email.",
        },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": paginatedList(
          "#/components/schemas/PaymentAdminListItem",
          "Paginated payments with payer and technician details.",
        ),
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/payments/success": {
    post: {
      tags: ["Payments"],
      summary: "Gateway callback: payment success (PUBLIC)",
      description: "Called by SSLCommerz. Server re-validates val_id before marking SUCCESS. Not for manual use.",
      responses: { "200": { description: "Payment validated and marked SUCCESS." } },
    },
  },
  "/payments/fail": {
    post: {
      tags: ["Payments"],
      summary: "Gateway callback: payment failed (PUBLIC)",
      responses: { "200": { description: "Payment marked FAILED." } },
    },
  },
  "/payments/cancel": {
    post: {
      tags: ["Payments"],
      summary: "Gateway callback: payment cancelled (PUBLIC)",
      responses: { "200": { description: "Payment cancelled." } },
    },
  },
  "/payments/ipn": {
    post: {
      tags: ["Payments"],
      summary: "Gateway IPN: server-to-server payment notification (PUBLIC)",
      description:
        "Instant Payment Notification from SSLCommerz. Server re-validates the payload and reconciles payment status. Fired server-to-server, not for manual use. Returns a bare 200 acknowledgement (no body).",
      responses: { "200": { description: "IPN acknowledged." } },
    },
  },
};
