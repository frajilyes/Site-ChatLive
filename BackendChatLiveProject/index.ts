import { env } from "./config/env";

import http from "node:http";

import compression from "compression";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";

import connectDB from "./config/db";
import { watchLauncher } from "./config/launcher";
import { attachRealtime, resetPresence } from "./config/realtime";
import {
  measureRequests,
  readServiceHealth,
  startUptimeTracking,
  stopUptimeTracking,
} from "./config/uptime";
import { ensureSiteContent } from "./Controllers/siteController";
import { errorHandler, notFound } from "./Middlewares/errorHandler";
import { apiLimiter, sanitizeInput, securityHeaders } from "./Middlewares/security";
import ApiError from "./Utils/ApiError";
import authRouter from "./Routers/routeAuth";
import communityRouter from "./Routers/communityRouter";
import contactRouter from "./Routers/contactRouter";
import messageRouter from "./Routers/messageRouter";
import newsletterRouter from "./Routers/newsletterRouter";
import roomRouter from "./Routers/roomRouter";
import showcaseRouter from "./Routers/showcaseRouter";
import siteRouter from "./Routers/siteRouter";
import statsRouter from "./Routers/statsRouter";
import testimonialRouter from "./Routers/testimonialRouter";
import userRouter from "./Routers/userRouter";

const PORT = env.PORT;

// Fermeture d'une fenetre de terminal : Windows n'accorde que ~5 s avant de
// tuer l'arbre. En dev on rend la main plus vite pour liberer le port a coup sur.
const FORCE_EXIT_MS = env.IS_PRODUCTION ? 10_000 : 3_000;

const ORIGINS = env.ORIGINS;

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY);

app.use(securityHeaders);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ORIGINS.includes(origin)) return callback(null, true);
      callback(ApiError.forbidden("Origin not allowed."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
);

app.use(measureRequests);

app.use(compression());

app.use("/api", apiLimiter);

app.use(express.json({ limit: "100kb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "100kb", parameterLimit: 50 }));
app.use(sanitizeInput);

app.get("/api/health", async (req, res) => {
  const health = await readServiceHealth();
  res.status(200).json({
    status: "ok",
    service: "ChatLive API",
    environment: env.NODE_ENV,
    uptime: health.uptimeSeconds,
    availability: health.availability,
    latencyMs: health.latencyMs,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/messages", messageRouter);
app.use("/api/communities", communityRouter);
app.use("/api/contact", contactRouter);
app.use("/api/site", siteRouter);
app.use("/api/stats", statsRouter);
app.use("/api/testimonials", testimonialRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/showcase", showcaseRouter);

app.use(notFound);
app.use(errorHandler);

async function start(): Promise<void> {
  await connectDB();

  await ensureSiteContent();

  await resetPresence();

  await startUptimeTracking();

  const httpServer = http.createServer(app);
  httpServer.headersTimeout = 20_000;
  httpServer.requestTimeout = 30_000;
  httpServer.keepAliveTimeout = 5_000;
  attachRealtime(httpServer, { origins: ORIGINS });

  httpServer.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Le port ${PORT} est deja utilise. Lancez « npm run free-port » pour arreter ` +
          `le serveur precedent, ou changez PORT dans le .env.`,
      );
      process.exit(1);
    }
    throw error;
  });

  httpServer.listen(PORT, () => {
    console.log(`API ChatLive sur http://localhost:${PORT}`);
    console.log("Temps reel (Socket.IO) actif sur le meme port");
    console.log(`Origines autorisees : ${ORIGINS.join(", ")}`);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("Promesse rejetee sans gestionnaire :", reason);
    httpServer.close(() => process.exit(1));
  });
  process.on("uncaughtException", (error) => {
    console.error("Exception non rattrapee :", error);
    httpServer.close(() => process.exit(1));
    setTimeout(() => process.exit(1), 5_000).unref();
  });

  let closing = false;
  function shutdown(reason: string, code: number): void {
    if (closing) process.exit(code);
    closing = true;
    console.log(`
${reason} : fermeture du serveur...`);

    const forced = setTimeout(() => process.exit(code), FORCE_EXIT_MS);
    forced.unref();

    httpServer.close(() => {
      void stopUptimeTracking()
        .catch(() => undefined)
        .then(() => mongoose.connection.close(false))
        .finally(() => process.exit(0));
    });
    httpServer.closeAllConnections?.();
  }

  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"] as const) {
    process.on(signal, () => shutdown(`Signal ${signal} recu`, 130));
  }

  if (!env.IS_PRODUCTION) {
    watchLauncher((launcher) => shutdown(`Lanceur ferme (${launcher})`, 0));
  }
}

void start();
