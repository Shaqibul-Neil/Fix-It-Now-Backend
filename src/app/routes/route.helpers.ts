import { authenticate } from "../../middlewares/authenticate";
import type { TRequestHandler } from "../../types/express.types";

//any logged in user
export const protectedRoute = (
  ...middlewares: TRequestHandler[]
): TRequestHandler[] => [authenticate, ...middlewares];

//logged in + role gate
export const roleRoute = () => [];
