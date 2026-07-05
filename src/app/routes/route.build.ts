import { Router } from "express";
import type { TRouteConfig } from "./route.types";

export const buildRoutes = (routes: TRouteConfig[]) => {
  const router = Router();
  routes.forEach(({ method, path, middlewares = [], handler }) => {
    router[method](path, ...middlewares, handler);
  });
  return router;
};
