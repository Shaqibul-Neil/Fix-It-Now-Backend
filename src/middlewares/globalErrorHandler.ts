import { ZodError } from "zod";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";
import type {
  TRequest,
  TResponse,
  TNextFunction,
} from "../types/express.types";
import { AppError } from "../utils/appError";
import { handlePrismaError } from "./prismaErrorHandler";

export const globalErrorHandler = (
  err: unknown,
  req: TRequest,
  res: TResponse,
  next: TNextFunction,
) => {
  let statusCode: number = 500;
  let message: string = "Something went wrong";
  let errorDetails: unknown = null;
  const prismaError = handlePrismaError(err);

  // ===============================
  // Zod Validation Error
  // ===============================
  if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation failed";
    errorDetails = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }
  // ===============================
  // Prisma Error
  // ===============================
  else if (prismaError.isPrismaError) {
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    errorDetails = prismaError.errorDetails;
  }

  // ===============================
  // Custom App Error
  // ===============================
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = err.errorDetails ?? null;
  }

  // ===============================
  // Native Error
  // ===============================
  else if (err instanceof Error) {
    message = err.message;
  }

  // ===============================
  // Unknown Error
  // ===============================
  else {
    message = "Something went wrong";
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};
