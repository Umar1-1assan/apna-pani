import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { authRouter } from "./routes/auth";
import { customersRouter } from "./routes/customers";
import { healthRouter } from "./routes/health";
import { uploadsRouter } from "./routes/uploads";
import { errorHandler, notFound } from "./middleware/error";

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200
    })
  );

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/customers", customersRouter);
  app.use("/api/uploads", uploadsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
