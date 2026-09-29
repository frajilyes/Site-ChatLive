import type { RequestHandler } from "express";

import ServiceRun, { type ServiceRunDocument } from "../Models/serviceRun";
import type { ServiceHealth } from "../types/index";
import { env } from "./env";

const BEAT_MS = 60_000;

const GRACE_MS = 90_000;

const SAMPLE_LIMIT = 500;

let run: ServiceRunDocument | null = null;
let timer: NodeJS.Timeout | null = null;
let requests = 0;
const samples: number[] = [];

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : Math.round(sorted[middle]);
}

export const measureRequests: RequestHandler = (req, res, next) => {
  const started = process.hrtime.bigint();
  res.on("finish", () => {
    const elapsed = Number(process.hrtime.bigint() - started) / 1_000_000;
    requests += 1;
    samples.push(elapsed);
    if (samples.length > SAMPLE_LIMIT) samples.shift();
  });
  next();
};

export async function startUptimeTracking(): Promise<void> {
  const now = new Date();
  run = await ServiceRun.create({
    startedAt: now,
    lastBeatAt: now,
    environment: env.NODE_ENV,
    requests: 0,
    latencyP50: 0,
  });
  timer = setInterval(() => {
    void beat();
  }, BEAT_MS);
  timer.unref();
}

async function beat(): Promise<void> {
  if (!run) return;
  try {
    await ServiceRun.updateOne(
      { _id: run._id },
      { $set: { lastBeatAt: new Date(), requests, latencyP50: median(samples) } },
    );
  } catch (error) {
    console.error(
      "Battement de disponibilite non enregistre :",
      error instanceof Error ? error.message : error,
    );
  }
}

export async function stopUptimeTracking(): Promise<void> {
  if (timer) clearInterval(timer);
  await beat();
  run = null;
}

export async function readServiceHealth(days = 30): Promise<ServiceHealth> {
  const windowMs = days * 24 * 3600 * 1000;
  const since = new Date(Date.now() - windowMs);

  const runs = await ServiceRun.find({ lastBeatAt: { $gte: since } })
    .sort({ startedAt: 1 })
    .select("startedAt lastBeatAt requests latencyP50")
    .lean();

  const floor = since.getTime();
  const ceiling = Date.now();

  let covered = 0;
  let openStart: number | null = null;
  let openEnd = 0;

  for (const entry of runs) {
    const start = Math.max(floor, new Date(entry.startedAt).getTime());
    const end = Math.min(ceiling, new Date(entry.lastBeatAt).getTime() + BEAT_MS);
    if (end <= start) continue;
    if (openStart === null) {
      openStart = start;
      openEnd = end;
      continue;
    }
    if (start <= openEnd + GRACE_MS) {
      openEnd = Math.max(openEnd, end);
    } else {
      covered += openEnd - openStart;
      openStart = start;
      openEnd = end;
    }
  }
  if (openStart !== null) covered += openEnd - openStart;

  const firstStart = runs.length > 0 ? new Date(runs[0].startedAt).getTime() : ceiling;
  const observed = Math.max(ceiling - Math.max(floor, firstStart), 1);
  const availability = Math.min(100, (covered / observed) * 100);

  const weighted = runs.reduce(
    (total, entry) => {
      if (!entry.latencyP50 || !entry.requests) return total;
      return {
        sum: total.sum + entry.latencyP50 * entry.requests,
        count: total.count + entry.requests,
      };
    },
    { sum: 0, count: 0 },
  );
  const live = median(samples);
  const latencyMs = weighted.count > 0 ? Math.round(weighted.sum / weighted.count) : live;

  return {
    availability: Number(availability.toFixed(2)),
    latencyMs: latencyMs || live,
    requests,
    uptimeSeconds: Math.round(process.uptime()),
  };
}
