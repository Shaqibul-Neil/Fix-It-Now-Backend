export const notificationPaths = {
  "/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "List own notifications (+ unread count)",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "isRead", in: "query", required: false, schema: { type: "boolean" }, description: "Filter by read state." },
        { $ref: "#/components/parameters/PageParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": { description: "Paginated notifications with unread count." },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/notifications/unread-count": {
    get: {
      tags: ["Notifications"],
      summary: "Unread notification count",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Unread count." },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/notifications/read-all": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark all notifications as read",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "All notifications marked read." },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/notifications/{id}/read": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark one notification as read",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": { description: "Notification marked read." },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
};
