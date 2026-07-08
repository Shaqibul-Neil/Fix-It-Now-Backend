import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./openapi";

// Vercel serverless  swagger-ui asset 404  → CDN load
const CDN = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14";

const swaggerOptions = {
  customSiteTitle: "FixItNow API Docs",
  customCssUrl: `${CDN}/swagger-ui.min.css`,
  customJs: [
    `${CDN}/swagger-ui-bundle.min.js`,
    `${CDN}/swagger-ui-standalone-preset.min.js`,
  ],
};

const router = Router();
router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(openapiSpec, swaggerOptions));

export const swaggerMiddleware = router;
