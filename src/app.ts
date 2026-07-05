import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { TApplication } from "./types/express.types";
import config from "./config";

const app: TApplication = express();

//Middleware Pipeline
app.use(
  cors({
    origin: [config.url, config.local_url, config.app_url],
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Application routes
app.use("/api", router);

export default app;
