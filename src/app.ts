import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import httpStatus from "http-status";
import type { TApplication, TRequest, TResponse } from "./types/express.types";
import config from "./config";
import { sendResponse } from "./utils/sendResponse";
import router, { mountedPaths } from "./app/routes";
import { notFound } from "./middlewares/notFound";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { swaggerMiddleware } from "./docs/swagger";

const app: TApplication = express();

//Middleware Pipeline
app.use(
  cors({
    origin: [config.url, config.local_url, config.app_url],
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Swagger
app.use("/api/docs", swaggerMiddleware);
//Application routes
app.use("/api", router);
app.get("/", (req: TRequest, res: TResponse) => {
  sendResponse({
    res,
    status: httpStatus.OK,
    success: true,
    message: "Welcome to Fix It Now Server",
  });
});

// Not Found Route
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
