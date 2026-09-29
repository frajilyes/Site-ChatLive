import Community from "../Models/community";
import Message from "../Models/message";
import Room from "../Models/room";
import Testimonial from "../Models/testimonial";
import User from "../Models/userAuth";
import { readServiceHealth } from "../config/uptime";
import type { MetricSource, MetricValues, ServiceHealth } from "../types/index";

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function precisionOf(source: MetricSource): number {
  if (source === "uptime") return 2;
  if (source === "rating") return 1;
  return 0;
}

interface RatingRow {
  average: number;
  total: number;
}

export interface Measures {
  values: MetricValues;
  health: ServiceHealth;
}

const CACHE_MS = 10_000;

let cache: { at: number; promise: Promise<Measures> } | null = null;

export function cachedMeasures(): Promise<Measures> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.promise;

  const promise = readServiceHealth().then(async (health) => ({
    health,
    values: await computeMetrics(health),
  }));
  cache = { at: now, promise };
  promise.catch(() => {
    if (cache?.promise === promise) cache = null;
  });
  return promise;
}

export async function computeMetrics(health?: ServiceHealth): Promise<MetricValues> {
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [
    users,
    countries,
    languages,
    messages,
    messages30d,
    messagesToday,
    rooms,
    publicRooms,
    communities,
    onlineUsers,
    ratings,
    service,
  ] = await Promise.all([
    User.countDocuments(),
    User.distinct("country"),
    User.distinct("language"),
    Message.countDocuments(),
    Message.countDocuments({ createdAt: { $gte: monthAgo } }),
    Message.countDocuments({ createdAt: { $gte: startOfToday() } }),
    Room.countDocuments(),
    Room.countDocuments({ visibility: "public" }),
    Community.countDocuments(),
    User.countDocuments({ presence: "online" }),
    Testimonial.aggregate<RatingRow>([
      { $match: { status: "approved" } },
      { $group: { _id: null, average: { $avg: "$rating" }, total: { $sum: 1 } } },
    ]),
    health ? Promise.resolve(health) : readServiceHealth(),
  ]);

  const rating = ratings[0]?.average ?? 0;

  return {
    users,
    countries: countries.length,
    languages: languages.length,
    messages,
    messages30d,
    messagesToday,
    rooms,
    publicRooms,
    communities,
    onlineUsers,
    uptime: service.availability,
    latency: service.latencyMs,
    rating: Number(rating.toFixed(1)),
    testimonials: ratings[0]?.total ?? 0,
  };
}
