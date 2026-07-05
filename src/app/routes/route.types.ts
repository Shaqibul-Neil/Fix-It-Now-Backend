import type { TRequestHandler } from "../../types/express.types";

export type THttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type TRouteConfig = {
  method: THttpMethod;
  path: string;
  handler: TRequestHandler;
  middlewares?: TRequestHandler;
};

export type TRouteModule = {
  basePath: string;
  routes: TRouteConfig[];
};
