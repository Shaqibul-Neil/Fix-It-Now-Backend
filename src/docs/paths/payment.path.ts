const paymentStatusEnum = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"];

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
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "status", in: "query", required: false, schema: { type: "string", enum: paymentStatusEnum } },
        { name: "period", in: "query", required: false, schema: { type: "integer" }, description: "Trailing days window." },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated payments." },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/payments/{id}": {
    get: {
      tags: ["Payments"],
      summary: "Customer (own) or Admin: payment details",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": { description: "Payment details." },
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
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "status", in: "query", required: false, schema: { type: "string", enum: paymentStatusEnum } },
        { name: "period", in: "query", required: false, schema: { type: "integer" } },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated all payments." },
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
