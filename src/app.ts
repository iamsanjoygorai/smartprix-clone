import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import router from "./routes";
import path from "path";
import historyRoutes from "./modules/history/history.routes"; 
import cookieParser from "cookie-parser";

const app = express();


app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads")),
);

app.get("/debug-review", (_req, res) => {
  res.json({
    success: true,
    message: "This is the app.ts file currently running",
  });
});

app.use("/api", router);

app.use(
  "/api/admin/history",
  historyRoutes,
);

export default app;