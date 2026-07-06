import {
  type Application,
  type NextFunction,
  type Request,
  type Response,
  type RequestHandler,
} from "express";
import type { IAuthUser } from "../app/modules/auth/auth.interface";

declare global {
  namespace Express {
    interface Request {
      user: IAuthUser;
    }
  }
}

export type TRequest = Request;
export type TResponse = Response;
export type TApplication = Application;
export type TNextFunction = NextFunction;
export type TRequestHandler = RequestHandler;
