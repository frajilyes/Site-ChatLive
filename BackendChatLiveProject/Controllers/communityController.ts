import type { QueryFilter, Types } from "mongoose";

import Community, { type ICommunity } from "../Models/community";
import Room from "../Models/room";
import ApiError from "../Utils/ApiError";
import asyncHandler from "../Utils/asyncHandler";
import { type AudienceCounts, publicCommunity } from "../Utils/presenters";
import { param } from "../Utils/params";

const WRITABLE_FIELDS = [
  "name",
  "topic",
  "description",
  "languages",
  "emoji",
  "featured",
] as const satisfies readonly (keyof ICommunity)[];

const NO_AUDIENCE: AudienceCounts = { members: 0, online: 0 };

async function countAudiences(
  ids: readonly Types.ObjectId[],
): Promise<Map<string, AudienceCounts>> {
  if (ids.length === 0) return new Map();

  const rows = await Room.aggregate<{ _id: Types.ObjectId } & AudienceCounts>([
    { $match: { community: { $in: ids } } },
    { $unwind: "$members" },
    { $group: { _id: "$community", people: { $addToSet: "$members.user" } } },
    {
      $lookup: {
        from: "users",
        localField: "people",
        foreignField: "_id",
        as: "accounts",
      },
    },
    {
      $project: {
        members: { $size: "$accounts" },
        online: {
          $size: {
            $filter: {
              input: "$accounts",
              as: "account",
              cond: { $eq: ["$$account.presence", "online"] },
            },
          },
        },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [String(row._id), { members: row.members, online: row.online }]),
  );
}

function pickFields(body: Record<string, unknown>): Partial<ICommunity> {
  const fields: Record<string, unknown> = {};
  for (const key of WRITABLE_FIELDS) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  return fields as Partial<ICommunity>;
}

export const getAllCommunities = asyncHandler(async (req, res) => {
  const { topic, search, featured } = req.query;

  const query: QueryFilter<ICommunity> = {};
  if (topic && topic !== "All") {
    query.topic = String(topic);
  }
  if (featured !== undefined) {
    query.featured = featured === "true";
  }
  if (search) {
    const pattern = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: pattern }, { description: pattern }, { topic: pattern }];
  }

  const communities = await Community.find(query).sort({ featured: -1, name: 1 });
  const audiences = await countAudiences(communities.map((community) => community._id));

  const data = communities
    .map((community) =>
      publicCommunity(community, audiences.get(String(community._id)) ?? NO_AUDIENCE),
    )
    .sort((left, right) =>
      left.featured === right.featured
        ? right.members - left.members
        : Number(right.featured) - Number(left.featured),
    );

  res.status(200).json({ total: data.length, data });
});

export const getTopics = asyncHandler(async (req, res) => {
  const topics = await Community.distinct("topic");
  res.status(200).json({ data: ["All", ...topics.sort()] });
});

export const getCommunityById = asyncHandler(async (req, res) => {
  const community = await Community.findById(param(req, "id"));
  if (!community) {
    throw ApiError.notFound("This community does not exist.");
  }

  const audiences = await countAudiences([community._id]);

  res.status(200).json({
    community: publicCommunity(
      community,
      audiences.get(String(community._id)) ?? NO_AUDIENCE,
    ),
  });
});

export const createCommunity = asyncHandler(async (req, res) => {
  const community = await Community.create(pickFields(req.body));
  res.status(201).json({ message: "Community created", community: publicCommunity(community) });
});

export const updateCommunity = asyncHandler(async (req, res) => {
  const updated = await Community.findByIdAndUpdate(
    param(req, "id"),
    { $set: pickFields(req.body) },
    { new: true, runValidators: true },
  );
  if (!updated) {
    throw ApiError.notFound("This community does not exist.");
  }
  res
    .status(200)
    .json({ message: "Community updated", community: publicCommunity(updated) });
});

export const deleteCommunity = asyncHandler(async (req, res) => {
  const deleted = await Community.findByIdAndDelete(param(req, "id"));
  if (!deleted) {
    throw ApiError.notFound("This community does not exist.");
  }
  res.status(200).json({ message: "Community deleted" });
});
