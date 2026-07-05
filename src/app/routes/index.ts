import { Router } from "express";
import { routeRegistry } from "./route.registry";
import { buildRoutes } from "./route.build";

const router = Router();

routeRegistry.forEach((module) => {
  router.use(module.basePath, buildRoutes(module.routes));
});

export const mountedPaths = routeRegistry.map(
  ({ basePath }) => `/api/${basePath}`,
);

export default router;
