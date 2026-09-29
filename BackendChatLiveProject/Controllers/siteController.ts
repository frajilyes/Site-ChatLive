import SiteContent, { CONTENT_SECTIONS, type ISiteContent } from "../Models/siteContent";
import SiteSettings, { SETTINGS_SLUG } from "../Models/siteSettings";
import { CONTACT_SUBJECTS } from "../Models/contactMessage";
import ApiError from "../Utils/ApiError";
import asyncHandler from "../Utils/asyncHandler";
import { idOf } from "../Utils/ids";
import { cachedMeasures, precisionOf } from "../Utils/metrics";
import { contentEntry, siteIdentity } from "../Utils/presenters";
import { param } from "../Utils/params";
import { COUNTRIES } from "../config/countries";
import {
  DEFAULT_CONTENT,
  DEFAULT_SITE,
  FOOTER_RELINKS,
  HOME_LINKS,
  NAV_CHILDREN,
} from "../config/defaultContent";
import { env } from "../config/env";
import type {
  AuthBenefit,
  ContactChannel,
  ContentEntry,
  ContentPayload,
  ContentSection,
  FaqItem,
  Feature,
  FooterColumn,
  FooterLink,
  Metric,
  MetricSource,
  MetricValues,
  Milestone,
  NavItem,
  Office,
  Platform,
  Plan,
  SecurityPoint,
  SecurityRow,
  SiteBundle,
  SiteValue,
  SocialLink,
  Stat,
  Step,
  TeamMember,
} from "../types/index";
import { approvedTestimonials } from "./testimonialController";

export async function ensureSiteContent(): Promise<void> {
  await SiteSettings.updateOne(
    { slug: SETTINGS_SLUG },
    { $setOnInsert: { slug: SETTINGS_SLUG, ...DEFAULT_SITE } },
    { upsert: true },
  );

  const existing = await SiteContent.find().select("section key").lean();
  const known = new Set(existing.map((entry) => `${entry.section}:${entry.key}`));

  const ranks = new Map<ContentSection, number>();
  const missing: Partial<ISiteContent>[] = [];

  for (const entry of DEFAULT_CONTENT) {
    const order = ranks.get(entry.section) ?? 0;
    ranks.set(entry.section, order + 1);
    if (known.has(`${entry.section}:${entry.key}`)) continue;
    missing.push({
      section: entry.section,
      key: entry.key,
      order,
      published: true,
      data: entry.data,
    });
  }

  if (missing.length > 0) {
    await SiteContent.insertMany(missing);
    console.log(`Contenu du site : ${missing.length} entrees ajoutees`);
  }

  await relinkFooter();
  await fillNavChildren();
  await fillHomeLinks();
}

async function fillHomeLinks(): Promise<void> {
  let filled = 0;
  for (const link of HOME_LINKS) {
    const entry = await SiteContent.findOne({ section: link.section, key: link.key });
    if (!entry || entry.data?.to !== undefined) continue;
    entry.data = {
      ...entry.data,
      to: link.to,
      ...(link.cta ? { cta: link.cta } : {}),
    };
    entry.markModified("data");
    await entry.save();
    filled += 1;
  }
  if (filled > 0) {
    console.log(`Accueil : ${filled} blocs relies a leur page`);
  }
}

async function fillNavChildren(): Promise<void> {
  const items = await SiteContent.find({ section: "navItem" });
  let filled = 0;
  for (const item of items) {
    const children = NAV_CHILDREN[item.key];
    if (!children || item.data?.children !== undefined) continue;
    item.data = { ...item.data, children };
    item.markModified("data");
    await item.save();
    filled += 1;
  }
  if (filled > 0) {
    console.log(`Navigation : ${filled} entrees dotees de leur sous-menu`);
  }
}

async function relinkFooter(): Promise<void> {
  const columns = await SiteContent.find({ section: "footerColumn" });
  let moved = 0;

  for (const column of columns) {
    const links = column.data?.links;
    if (!Array.isArray(links)) continue;

    let touched = false;
    const next = links.map((link) => {
      const entry = link as FooterLink;
      const rule = FOOTER_RELINKS.find(
        (candidate) => candidate.label === entry.label && candidate.from === entry.to,
      );
      if (!rule) return link;
      touched = true;
      moved += 1;
      return { ...entry, to: rule.to };
    });

    if (!touched) continue;
    column.data = { ...column.data, links: next };
    column.markModified("data");
    await column.save();
  }

  if (moved > 0) {
    console.log(`Pied de page : ${moved} liens amenes sur leur page dediee`);
  }
}

interface Sections {
  get<T extends { id: string } = ContentPayload>(section: ContentSection): T[];
}

async function readSection<T extends { id: string } = ContentPayload>(
  section: ContentSection,
): Promise<T[]> {
  const entries = await SiteContent.find({ section, published: true })
    .sort({ order: 1, createdAt: 1 })
    .lean();
  return entries.map((entry) => contentEntry<T>(entry));
}

async function readAllSections(): Promise<Sections> {
  const entries = await SiteContent.find({ published: true })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const grouped = new Map<ContentSection, ContentPayload[]>();
  for (const section of CONTENT_SECTIONS) grouped.set(section, []);
  for (const entry of entries) {
    grouped.get(entry.section)?.push(contentEntry(entry));
  }
  return grouped as unknown as Sections;
}

export interface StatSeed {
  id: string;
  label: string;
  suffix: string;
  source: MetricSource;
  to?: string;
}

export interface MetricSeed {
  id: string;
  title: string;
  detail: string;
  suffix: string;
  source: MetricSource;
}

export function fillStats(seeds: readonly StatSeed[], values: MetricValues): Stat[] {
  return seeds.map((seed) => ({
    id: seed.id,
    label: seed.label,
    suffix: seed.suffix,
    source: seed.source,
    value: values[seed.source] ?? 0,
    precision: precisionOf(seed.source),
    ...(seed.to ? { to: seed.to } : {}),
  }));
}

export function fillMetrics(seeds: readonly MetricSeed[], values: MetricValues): Metric[] {
  return seeds.map((seed) => ({
    id: seed.id,
    title: seed.title,
    detail: seed.detail,
    suffix: seed.suffix,
    source: seed.source,
    value: values[seed.source] ?? 0,
    precision: precisionOf(seed.source),
  }));
}

export const getSiteBundle = asyncHandler(async (req, res) => {
  const [settings, sections, measures, testimonials] = await Promise.all([
    SiteSettings.findOne({ slug: SETTINGS_SLUG }).lean(),
    readAllSections(),
    cachedMeasures(),
    approvedTestimonials(),
  ]);

  if (!settings) {
    throw ApiError.internal("The site identity has not been initialized yet.");
  }

  const { values, health } = measures;

  const bundle: SiteBundle = {
    site: siteIdentity(settings),
    nav: sections.get<NavItem>("navItem"),
    footer: sections.get<FooterColumn>("footerColumn"),
    social: sections.get<SocialLink>("socialLink"),
    features: sections.get<Feature>("feature"),
    steps: sections.get<Step>("step"),
    values: sections.get<SiteValue>("value"),
    plans: sections.get<Plan>("plan"),
    faq: sections.get<FaqItem>("faq"),
    team: sections.get<TeamMember>("team"),
    milestones: sections.get<Milestone>("milestone"),
    contactChannels: sections.get<ContactChannel>("contactChannel"),
    offices: sections.get<Office>("office"),
    authBenefits: sections.get<AuthBenefit>("authBenefit"),
    metrics: fillMetrics(sections.get<MetricSeed>("metric"), values),
    securityPoints: sections.get<SecurityPoint>("securityPoint"),
    securityRows: sections.get<SecurityRow>("securityRow"),
    platforms: sections.get<Platform>("platform"),
    stats: fillStats(sections.get<StatSeed>("stat"), values),
    testimonials,
    contactSubjects: CONTACT_SUBJECTS,
    countries: COUNTRIES,
    status: {
      ok: true,
      environment: env.NODE_ENV,
      availability: health.availability,
      latencyMs: health.latencyMs,
      uptimeSeconds: health.uptimeSeconds,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(bundle);
});

export const getContentSection = asyncHandler(async (req, res) => {
  const section = requireSection(param(req, "section"));

  if (section === "stat" || section === "metric") {
    const { values } = await cachedMeasures();
    const seeds = await readSection<StatSeed & MetricSeed>(section);
    const data = section === "stat" ? fillStats(seeds, values) : fillMetrics(seeds, values);
    res.status(200).json({ total: data.length, data });
    return;
  }

  const data = await readSection(section);
  res.status(200).json({ total: data.length, data });
});

export const getAllContentEntries = asyncHandler(async (req, res) => {
  const entries = await SiteContent.find().sort({ section: 1, order: 1, createdAt: 1 }).lean();

  const data: ContentEntry[] = entries.map((entry) => ({
    id: idOf(entry._id),
    section: entry.section,
    key: entry.key,
    order: entry.order,
    published: entry.published,
    data: (entry.data ?? {}) as Record<string, unknown>,
    updatedAt: new Date(entry.updatedAt).toISOString(),
  }));

  res.status(200).json({ total: data.length, data });
});

export const updateSiteSettings = asyncHandler(async (req, res) => {
  const writable = [
    "name",
    "tagline",
    "description",
    "email",
    "phone",
    "founded",
    "legalNote",
  ] as const;

  const fields: Record<string, unknown> = {};
  for (const key of writable) {
    const value = req.body[key];
    if (value === undefined) continue;
    if (key === "founded") {
      if (!Number.isInteger(value) || value < 1900 || value > 3000) {
        throw ApiError.badRequest("The founding year is not valid.", key);
      }
    } else if (typeof value !== "string" || value.length > 600) {
      throw ApiError.badRequest("This field must be text of at most 600 characters.", key);
    }
    if (key === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value as string)) {
      throw ApiError.badRequest("This email address does not look valid.", key);
    }
    fields[key] = value;
  }

  const settings = await SiteSettings.findOneAndUpdate(
    { slug: SETTINGS_SLUG },
    { $set: fields },
    { new: true, runValidators: true, upsert: true },
  );

  res.status(200).json({ message: "Identity updated", site: siteIdentity(settings) });
});

const URL_KEYS = new Set(["to", "href", "path", "ctaTo"]);

function isSafeUrl(value: string): boolean {
  const url = value.trim();
  if (url.startsWith("/")) return !url.startsWith("//") && !url.startsWith("/\\");
  if (url.startsWith("#")) return true;
  return /^(https?:\/\/|mailto:|tel:)/i.test(url);
}

const MAX_CONTENT_BYTES = 20_000;
const MAX_TEXT_LENGTH = 5_000;

function checkContent(value: unknown, key = "", depth = 0): void {
  if (depth > 6) {
    throw ApiError.badRequest("The content is nested too deeply.", "data");
  }
  if (typeof value === "string") {
    if (value.length > MAX_TEXT_LENGTH) {
      throw ApiError.badRequest("A text in the content is too long.", "data");
    }
    if (URL_KEYS.has(key) && value && !isSafeUrl(value)) {
      throw ApiError.badRequest(
        `Link rejected (${key}): use an internal path (/page), http(s)://, mailto: or tel:.`,
        "data",
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 100) {
      throw ApiError.badRequest("A list in the content is too long.", "data");
    }
    value.forEach((item) => checkContent(item, key, depth + 1));
    return;
  }
  if (value && typeof value === "object") {
    for (const [child, entry] of Object.entries(value)) checkContent(entry, child, depth + 1);
    return;
  }
  if (value !== null && !["number", "boolean", "undefined"].includes(typeof value)) {
    throw ApiError.badRequest("The content contains an unsupported value.", "data");
  }
}

function requireContentData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw ApiError.badRequest("The content must be an object.", "data");
  }
  if (JSON.stringify(value).length > MAX_CONTENT_BYTES) {
    throw ApiError.tooLarge("The content of this entry is too large.", "data");
  }
  checkContent(value);
  return value as Record<string, unknown>;
}

function requireOrder(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 10_000) {
    throw ApiError.badRequest("The order must be a positive integer.", "order");
  }
  return value as number;
}

function requireSection(value: string): ContentSection {
  if (!CONTENT_SECTIONS.includes(value as ContentSection)) {
    throw ApiError.notFound("This content section does not exist.");
  }
  return value as ContentSection;
}

export const createContentEntry = asyncHandler(async (req, res) => {
  const section = requireSection(param(req, "section"));
  const { order, published, data } = req.body;
  const key = typeof req.body.key === "string" ? req.body.key.trim() : "";

  if (!/^[A-Za-z0-9_-]{1,40}$/.test(key)) {
    throw ApiError.badRequest(
      "The key must be 1 to 40 characters: letters, digits, hyphens.",
      "key",
    );
  }

  const exists = await SiteContent.exists({ section, key });
  if (exists) {
    throw ApiError.conflict("This key already exists in the section.", "key");
  }

  const last = await SiteContent.findOne({ section }).sort({ order: -1 }).select("order").lean();

  const entry = await SiteContent.create({
    section,
    key,
    order: order === undefined ? (last ? last.order + 1 : 0) : requireOrder(order),
    published: published === undefined ? true : published === true,
    data: data === undefined ? {} : requireContentData(data),
  });

  res.status(201).json({ message: "Entry created", entry: contentEntry(entry) });
});

export const updateContentEntry = asyncHandler(async (req, res) => {
  const section = requireSection(param(req, "section"));
  const { order, published, data } = req.body;

  const fields: Record<string, unknown> = {};
  if (order !== undefined) fields.order = requireOrder(order);
  if (published !== undefined) fields.published = published === true;
  if (data !== undefined) fields.data = requireContentData(data);

  const entry = await SiteContent.findOneAndUpdate(
    { section, key: param(req, "key") },
    { $set: fields },
    { new: true, runValidators: true },
  );
  if (!entry) {
    throw ApiError.notFound("This content entry does not exist.");
  }

  res.status(200).json({ message: "Entry updated", entry: contentEntry(entry) });
});

export const reorderContentSection = asyncHandler(async (req, res) => {
  const section = requireSection(param(req, "section"));
  const { keys } = req.body;

  if (
    !Array.isArray(keys) ||
    keys.length > 500 ||
    keys.some((key) => typeof key !== "string")
  ) {
    throw ApiError.badRequest("The body must contain the ordered list of keys.", "keys");
  }

  const known = await SiteContent.find({ section }).select("key").lean();
  const expected = new Set(known.map((entry) => entry.key));
  if (keys.length !== expected.size || keys.some((key) => !expected.has(key))) {
    throw ApiError.badRequest(
      "The list must contain exactly the entries of the section.",
      "keys",
    );
  }

  await SiteContent.bulkWrite(
    keys.map((key: string, order: number) => ({
      updateOne: { filter: { section, key: key }, update: { $set: { order } } },
    })),
  );

  res.status(200).json({ message: "Order updated" });
});

export const deleteContentEntry = asyncHandler(async (req, res) => {
  const section = requireSection(param(req, "section"));

  const deleted = await SiteContent.findOneAndDelete({
    section,
    key: param(req, "key"),
  });
  if (!deleted) {
    throw ApiError.notFound("This content entry does not exist.");
  }

  res.status(200).json({ message: "Entry deleted" });
});
