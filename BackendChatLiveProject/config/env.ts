import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

function findEnvFile(): string | null {
  let dir = __dirname;
  for (;;) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const envPath = findEnvFile();
if (!envPath) {
  console.error("Fichier .env introuvable. Copiez .env.example en .env a la racine du projet.");
  process.exit(1);
}

const loaded = dotenv.config({ path: envPath, quiet: true });
if (loaded.error) {
  console.error(`Lecture de ${envPath} impossible :`, loaded.error.message);
  process.exit(1);
}

const REQUIRED = ["DB_URI", "JWT_SECRET"] as const;
const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
if (missing.length > 0) {
  console.error(`Variables absentes de ${envPath} : ${missing.join(", ")}`);
  process.exit(1);
}

const MIN_SECRET_LENGTH = 32;
if ((process.env.JWT_SECRET ?? "").trim().length < MIN_SECRET_LENGTH) {
  const advice =
    `JWT_SECRET doit compter au moins ${MIN_SECRET_LENGTH} caracteres aleatoires ` +
    `(par exemple : node -e "console.log(require('crypto').randomBytes(48).toString('base64'))").`;
  if (process.env.NODE_ENV === "production") {
    console.error(advice);
    process.exit(1);
  }
  console.warn(`[securite] ${advice}`);
}

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  TRUST_PROXY: Math.max(0, Number(process.env.TRUST_PROXY) || 0),
  DB_URI: process.env.DB_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  GOOGLE_CLIENT_ID: (process.env.GOOGLE_CLIENT_ID || "").trim(),
  ORIGINS: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  MAIL_HOST: (process.env.MAIL_HOST || "smtp.gmail.com").trim(),
  MAIL_PORT: Number(process.env.MAIL_PORT) || 465,
  MAIL_USER: (process.env.MAIL_USER || "").trim(),
  MAIL_PASS: (process.env.MAIL_PASS || "").replace(/\s+/g, ""),
  MAIL_FROM: (process.env.MAIL_FROM || "").trim(),
  VERIFICATION_TTL_MINUTES: Number(process.env.VERIFICATION_TTL_MINUTES) || 15,
  VERIFICATION_RESEND_SECONDS: Number(process.env.VERIFICATION_RESEND_SECONDS) || 60,
};

export default env;
