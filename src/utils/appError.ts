export class AppError extends Error {
  public statusCode: number;
  public errorDetails?: unknown;

  constructor(message: string, statusCode = 500, errorDetails?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
  }
}
