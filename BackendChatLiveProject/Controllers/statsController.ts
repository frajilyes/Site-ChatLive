import SiteContent from "../Models/siteContent";
import asyncHandler from "../Utils/asyncHandler";
import { cachedMeasures } from "../Utils/metrics";
import { contentEntry } from "../Utils/presenters";
import { env } from "../config/env";
import type { ServiceStatus } from "../types/index";
import { type MetricSeed, type StatSeed, fillMetrics, fillStats } from "./siteController";

export const getStats = asyncHandler(async (req, res) => {
  const [{ values, health }, seeds] = await Promise.all([
    cachedMeasures(),
    SiteContent.find({ section: { $in: ["stat", "metric"] }, published: true })
      .sort({ order: 1, createdAt: 1 })
      .lean(),
  ]);

  const stats = fillStats(
    seeds
      .filter((entry) => entry.section === "stat")
      .map((entry) => contentEntry<StatSeed>(entry)),
    values,
  );

  const metrics = fillMetrics(
    seeds
      .filter((entry) => entry.section === "metric")
      .map((entry) => contentEntry<MetricSeed>(entry)),
    values,
  );

  const status: ServiceStatus = {
    ok: true,
    environment: env.NODE_ENV,
    availability: health.availability,
    latencyMs: health.latencyMs,
    uptimeSeconds: health.uptimeSeconds,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json({ values, stats, metrics, status });
});
