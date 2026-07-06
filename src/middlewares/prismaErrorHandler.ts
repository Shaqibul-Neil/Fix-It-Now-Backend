import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";

export const handlePrismaError = (err: unknown) => {
  let isPrismaError = false;
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message: string = "Database error";
  let errorDetails: unknown = null;

  // ==========================================
  // Prisma Known Request Error
  // ==========================================
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    isPrismaError = true;
    switch (err.code) {
      case "P2000":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Value is too long.";
        errorDetails = {
          code: err.code,
          column: err.meta?.column_name ?? null,
        };
        break;

      case "P2001":
      case "P2015":
      case "P2025":
        statusCode = httpStatus.NOT_FOUND;
        message = "Record not found.";
        errorDetails = { code: err.code };
        break;

      case "P2002": {
        statusCode = httpStatus.CONFLICT;
        const meta = err.meta as {
          target?: string[];
          driverAdapterError?: {
            cause?: { constraint?: { fields?: string[] } };
          };
        };
        const fields =
          meta.target ?? meta.driverAdapterError?.cause?.constraint?.fields;
        message = "A record with the same value already exists.";
        errorDetails = {
          code: err.code,
          fields: fields ?? [],
        };
        break;
      }

      case "P2003":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Invalid reference.";
        errorDetails = {
          code: err.code,
          field: err.meta?.field_name ?? null,
        };
        break;

      case "P2004":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Database constraint failed.";
        errorDetails = { code: err.code };
        break;

      case "P2011":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Required field is missing.";
        errorDetails = { code: err.code };
        break;

      case "P2014":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Relation constraint failed.";
        errorDetails = { code: err.code };
        break;

      case "P2034":
        statusCode = httpStatus.CONFLICT;
        message = "Transaction conflict. Please retry.";
        errorDetails = { code: err.code };
        break;

      default:
        message = "Unexpected database error.";
        errorDetails = { code: err.code };
    }
  }
  // ==========================================
  // Prisma Validation Error
  // ==========================================
  else if (err instanceof Prisma.PrismaClientValidationError) {
    isPrismaError = true;
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid query structure. Check field names and types.";
  }
  // ==========================================
  // Prisma Initialization Error
  // ==========================================
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    isPrismaError = true;
    statusCode = httpStatus.SERVICE_UNAVAILABLE;
    message = "Database connection failed. Please try again later.";
  }
  // ==========================================
  // Prisma Unknown Request Error
  // ==========================================
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    isPrismaError = true;
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "An unknown database error occurred.";
  }

  return {
    isPrismaError,
    statusCode,
    message,
    errorDetails,
  };
};
