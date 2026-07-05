import { ZodError } from "zod";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";
import type {
  TRequest,
  TResponse,
  TNextFunction,
} from "../types/express.types";
import { AppError } from "../utils/appError";

export const globalErrorHandler = (
  err: unknown,
  req: TRequest,
  res: TResponse,
  next: TNextFunction,
) => {
  let statusCode: number = 500;
  let message: string = "Something went wrong";
  let errorDetails: unknown = null;

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
  // Prisma Known Error
  // ===============================
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2000":
        statusCode = httpStatus.BAD_REQUEST;
        message = `Value too long for column: ${
          (err.meta?.column_name as string) ?? "unknown"
        }`;
        break;

      case "P2001":
      case "P2015":
      case "P2025":
        statusCode = httpStatus.NOT_FOUND;
        message = (err.meta?.cause as string) ?? "Record not found";
        break;

      case "P2002":
        statusCode = httpStatus.CONFLICT;
        message = `${(err.meta?.target as string[])?.join(
          ", ",
        )} already exists`;
        break;

      case "P2003":
        statusCode = httpStatus.BAD_REQUEST;
        message = `Invalid reference: ${
          (err.meta?.field_name as string) ?? "related record does not exist"
        }`;
        break;

      case "P2004":
        statusCode = httpStatus.BAD_REQUEST;
        message = `Database constraint failed: ${
          (err.meta?.database_error as string) ?? err.message
        }`;
        break;

      case "P2011":
        statusCode = httpStatus.BAD_REQUEST;
        message = `Required field missing: ${
          (err.meta?.constraint as string) ?? "unknown"
        }`;
        break;

      case "P2014":
        statusCode = httpStatus.BAD_REQUEST;
        message = `Relation violation: ${
          (err.meta?.relation_name as string) ?? "required relation missing"
        }`;
        break;

      case "P2034":
        statusCode = httpStatus.CONFLICT;
        message = "Transaction conflict or deadlock. Please retry.";
        break;

      default:
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = `Database error (${err.code})`;
    }

    errorDetails = err.meta ?? null;
  }

  // ===============================
  // Prisma Validation Error
  // ===============================
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid query structure. Check field names and types.";
  }

  // ===============================
  // Prisma Initialization Error
  // ===============================
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.SERVICE_UNAVAILABLE;
    message = "Database connection failed. Please try again later.";
  }

  // ===============================
  // Prisma Unknown Error
  // ===============================
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "An unknown database error occurred.";
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
