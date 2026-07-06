import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import type { TRequestHandler } from "../../types/express.types";
import type { TUserRoles } from "../../types/types";

//any logged in user
export const protectedRoute = (
  ...middlewares: TRequestHandler[]
): TRequestHandler[] => [authenticate, ...middlewares];

//logged in + role gate
export const roleRoute = (
  roles: TUserRoles[],
  ...middlewares: TRequestHandler[]
) => [authenticate, authorize(...roles), ...middlewares];
