// FixItNow OpenAPI 3.0 spec — assembled from per-module schema + path files.
// Served at /api/docs via swagger-ui-express. Add a new module by creating its
// schema + path file and spreading it into `schemas` / `paths` below.
// Typed as Record<string, any> so it assigns cleanly to swaggerUi.setup(JsonObject).

import { securitySchemes, parameters, responses } from "./components";

import { authSchemas } from "./schemas/auth.schema";
import { technicianSchemas } from "./schemas/technician.schema";
import { categorySchemas } from "./schemas/category.schema";
import { serviceSchemas } from "./schemas/service.schema";
import { availabilitySchemas } from "./schemas/availability.schema";
import { bookingSchemas } from "./schemas/booking.schema";
import { paymentSchemas } from "./schemas/payment.schema";
import { reviewSchemas } from "./schemas/review.schema";
import { customerSchemas } from "./schemas/customer.schema";
import { adminSchemas } from "./schemas/admin.schema";

import { authPaths } from "./paths/auth.path";
import { technicianPaths } from "./paths/technician.path";
import { categoryPaths } from "./paths/category.path";
import { servicePaths } from "./paths/service.path";
import { availabilityPaths } from "./paths/availability.path";
import { bookingPaths } from "./paths/booking.path";
import { paymentPaths } from "./paths/payment.path";
import { reviewPaths } from "./paths/review.path";
import { customerPaths } from "./paths/customer.path";
import { adminPaths } from "./paths/admin.path";

export const openapiSpec: Record<string, any> = {
  openapi: "3.0.3",
  info: {
    title: "FixItNow API",
    version: "1.0.0",
    description:
      "Home-services marketplace backend. Customers book technicians for " +
      "plumbing/electrical/cleaning/painting; technicians manage services, " +
      "availability and bookings; admins moderate users, categories and reviews.",
  },
  // Relative server → works on localhost AND on the deployed (Vercel) host.
  servers: [{ url: "/api", description: "Same-origin (local + prod)" }],

  tags: [
    { name: "Auth", description: "Register, login, refresh, current user" },
    { name: "Technicians", description: "Technician profile + public listing" },
    { name: "Categories", description: "Service categories (public + admin)" },
    { name: "Services", description: "Technician services (public + owner)" },
    { name: "Availability", description: "Technician weekly availability slots" },
    { name: "Bookings", description: "Booking lifecycle (customer/tech/admin)" },
    { name: "Payments", description: "SSLCommerz payments + gateway callbacks" },
    { name: "Reviews", description: "Reviews (customer/public/admin moderation)" },
    { name: "Customer", description: "Customer profile" },
    { name: "Admin", description: "User management" },
  ],

  components: {
    securitySchemes,
    parameters,
    responses,
    schemas: {
      ...authSchemas,
      ...technicianSchemas,
      ...categorySchemas,
      ...serviceSchemas,
      ...availabilitySchemas,
      ...bookingSchemas,
      ...paymentSchemas,
      ...reviewSchemas,
      ...customerSchemas,
      ...adminSchemas,
    },
  },

  paths: {
    ...authPaths,
    ...technicianPaths,
    ...categoryPaths,
    ...servicePaths,
    ...availabilityPaths,
    ...bookingPaths,
    ...paymentPaths,
    ...reviewPaths,
    ...customerPaths,
    ...adminPaths,
  },
};
