import type { ContentSection, FooterLink, SiteIdentity } from "../types/index";

export interface FooterRelink {
  label: string;
  from: string;
  to: string;
}

export interface HomeLink {
  section: ContentSection;
  key: string;
  to: string;
  cta?: string;
}

export interface DefaultContentEntry {
  section: ContentSection;
  key: string;
  data: Record<string, unknown>;
}

export const DEFAULT_SITE: SiteIdentity = {
  name: "ChatLive",
  tagline: "Talk live, anywhere in the world",
  description: "ChatLive brings friends from every corner of the globe together in real-time rooms: instant messages, original language flagged on every message, live presence and conversations that stay between their members.",
  email: "",
  phone: "",
  founded: new Date().getFullYear(),
  legalNote: "",
};
export const FOOTER_RELINKS: readonly FooterRelink[] = [
  { label: "Careers", from: "/about", to: "/careers" },
  { label: "Press", from: "/about", to: "/press" },
  { label: "Help center", from: "/contact", to: "/help" },
  { label: "Service status", from: "/features", to: "/status" },
  { label: "API documentation", from: "/features", to: "/api-docs" },
  { label: "Changelog", from: "/about", to: "/changelog" },
  { label: "Privacy", from: "/contact", to: "/privacy" },
  { label: "Terms of use", from: "/contact", to: "/terms" },
  { label: "Cookies", from: "/contact", to: "/cookies" },
  { label: "Security", from: "/features", to: "/security" },
];
export const NAV_CHILDREN: Readonly<Record<string, readonly FooterLink[]>> = {
  features: [
    { label: "Security", to: "/security" },
    { label: "API documentation", to: "/api-docs" },
    { label: "Service status", to: "/status" },
  ],
  about: [
    { label: "Careers", to: "/careers" },
    { label: "Press", to: "/press" },
    { label: "Changelog", to: "/changelog" },
  ],
  contact: [
    { label: "Help center", to: "/help" },
    { label: "Privacy", to: "/privacy" },
    { label: "Terms of use", to: "/terms" },
  ],
};
export const HOME_LINKS: readonly HomeLink[] = [
  { section: "stat", key: "users", to: "/communities" },
  { section: "stat", key: "countries", to: "/about" },
  { section: "stat", key: "messages", to: "/features" },
  { section: "stat", key: "uptime", to: "/status" },
  { section: "feature", key: "realtime", to: "/features" },
  { section: "feature", key: "translate", to: "/features" },
  { section: "feature", key: "privacy", to: "/security" },
  { section: "feature", key: "presence", to: "/communities" },
  { section: "feature", key: "devices", to: "/features" },
  { section: "feature", key: "moderation", to: "/security" },
  { section: "step", key: "step-1", to: "/register", cta: "Create my account" },
  { section: "step", key: "step-2", to: "/verify", cta: "Enter my code" },
  { section: "step", key: "step-3", to: "/communities", cta: "Browse rooms" },
];
export const DEFAULT_CONTENT: readonly DefaultContentEntry[] = [
  {
    section: "navItem",
    key: "home",
    data: {
      label: "Home",
      path: "/",
      description: "Discover the platform and its world",
      icon: "home",
    },
  },
  {
    section: "navItem",
    key: "features",
    data: {
      label: "Features",
      path: "/features",
      description: "Everything ChatLive can do",
      icon: "sparkles",
      children: [
        { label: "Security", to: "/security" },
        { label: "API documentation", to: "/api-docs" },
        { label: "Service status", to: "/status" },
      ],
    },
  },
  {
    section: "navItem",
    key: "chat",
    data: {
      label: "Chat",
      path: "/chat",
      description: "Join your live rooms",
      icon: "chat",
    },
  },
  {
    section: "navItem",
    key: "communities",
    data: {
      label: "Communities",
      path: "/communities",
      description: "Join rooms from all over the world",
      icon: "globe",
    },
  },
  {
    section: "navItem",
    key: "pricing",
    data: {
      label: "Pricing",
      path: "/pricing",
      description: "Simple, transparent plans",
      icon: "tag",
    },
  },
  {
    section: "navItem",
    key: "about",
    data: {
      label: "About",
      path: "/about",
      description: "The team and the story of the project",
      icon: "users",
      children: [
        { label: "Careers", to: "/careers" },
        { label: "Press", to: "/press" },
        { label: "Changelog", to: "/changelog" },
      ],
    },
  },
  {
    section: "navItem",
    key: "contact",
    data: {
      label: "Contact",
      path: "/contact",
      description: "Write to us, we reply fast",
      icon: "mail",
      children: [
        { label: "Help center", to: "/help" },
        { label: "Privacy", to: "/privacy" },
        { label: "Terms of use", to: "/terms" },
      ],
    },
  },
  {
    section: "footerColumn",
    key: "product",
    data: {
      title: "Product",
      links: [
        { label: "Features", to: "/features" },
        { label: "Live chat", to: "/chat" },
        { label: "Communities", to: "/communities" },
        { label: "Pricing", to: "/pricing" },
      ],
    },
  },
  {
    section: "footerColumn",
    key: "company",
    data: {
      title: "Company",
      links: [
        { label: "About", to: "/about" },
        { label: "Contact", to: "/contact" },
        { label: "Careers", to: "/careers" },
        { label: "Press", to: "/press" },
      ],
    },
  },
  {
    section: "footerColumn",
    key: "resources",
    data: {
      title: "Resources",
      links: [
        { label: "Help center", to: "/help" },
        { label: "Service status", to: "/status" },
        { label: "API documentation", to: "/api-docs" },
        { label: "Changelog", to: "/changelog" },
      ],
    },
  },
  {
    section: "footerColumn",
    key: "legal",
    data: {
      title: "Legal",
      links: [
        { label: "Privacy", to: "/privacy" },
        { label: "Terms of use", to: "/terms" },
        { label: "Cookies", to: "/cookies" },
        { label: "Security", to: "/security" },
      ],
    },
  },
  {
    section: "stat",
    key: "users",
    data: { label: "Registered members", suffix: "", source: "users", to: "/communities" },
  },
  {
    section: "stat",
    key: "countries",
    data: { label: "Countries represented", suffix: "", source: "countries", to: "/about" },
  },
  {
    section: "stat",
    key: "messages",
    data: {
      label: "Messages in 30 days",
      suffix: "",
      source: "messages30d",
      to: "/features",
    },
  },
  {
    section: "stat",
    key: "uptime",
    data: { label: "Measured uptime", suffix: "%", source: "uptime", to: "/status" },
  },
  {
    section: "feature",
    key: "realtime",
    data: {
      title: "Real time",
      description: "Messages travel over a persistent connection (WebSocket): they arrive as soon as they are written, with no reload and no waiting.",
      icon: "bolt",
      tag: "Performance",
      to: "/features",
    },
  },
  {
    section: "feature",
    key: "translate",
    data: {
      title: "Everyone in their own language",
      description: "Each member's language is inferred from their country: a message written in a language other than yours is flagged. The text shown is always the one that was sent.",
      icon: "translate",
      tag: "Borderless",
      to: "/features",
    },
  },
  {
    section: "feature",
    key: "privacy",
    data: {
      title: "Closed rooms",
      description: "A private room is only visible to its members, and exchanges travel encrypted with TLS between your browser and the server.",
      icon: "lock",
      tag: "Privacy",
      to: "/security",
    },
  },
  {
    section: "feature",
    key: "presence",
    data: {
      title: "Live presence",
      description: "Who is here, who just left, who is typing: every member's presence is updated to the second.",
      icon: "users",
      tag: "Alive",
      to: "/communities",
    },
  },
  {
    section: "feature",
    key: "devices",
    data: {
      title: "Everywhere with you",
      description: "A single web app, on mobile as on desktop: your session follows you, and so do your rooms and unread messages.",
      icon: "device",
      tag: "Multi-device",
      to: "/features",
    },
  },
  {
    section: "feature",
    key: "moderation",
    data: {
      title: "Well-run rooms",
      description: "Every room has its owner and its moderators, with the rights that come with them: invite, remove, close.",
      icon: "shield",
      tag: "Trust",
      to: "/security",
    },
  },
  {
    section: "step",
    key: "step-1",
    data: {
      index: "01",
      title: "Create your profile",
      description: "A name, an email address, a country: thirty seconds is enough, no credit card required.",
      to: "/register",
      cta: "Create my account",
    },
  },
  {
    section: "step",
    key: "step-2",
    data: {
      index: "02",
      title: "Confirm your address",
      description: "A six-digit code arrives by email. It opens your session: nobody can sign up in your place.",
      to: "/verify",
      cta: "Enter my code",
    },
  },
  {
    section: "step",
    key: "step-3",
    data: {
      index: "03",
      title: "Join a room",
      description: "Open a public room, create your own, invite your friends: the first message goes out right away.",
      to: "/communities",
      cta: "Browse rooms",
    },
  },
  {
    section: "value",
    key: "v1",
    data: {
      title: "Distance should cost nothing",
      description: "Talking to a friend 10,000 km away should be as easy as crossing the street. That guides every one of our decisions.",
    },
  },
  {
    section: "value",
    key: "v2",
    data: {
      title: "Your data belongs to you",
      description: "No ads, no reselling, no profiling: the service only collects what it needs to run your rooms.",
    },
  },
  {
    section: "value",
    key: "v3",
    data: {
      title: "Open by default",
      description: "The API behind this site is publicly documented, endpoint by endpoint.",
    },
  },
  {
    section: "faq",
    key: "f2",
    data: {
      question: "How is my friends' language recognized?",
      answer: "Every account has a language, inferred from the country chosen at sign-up. A message written in a language other than yours is flagged as such; its text is not translated, it is displayed exactly as it was sent.",
    },
  },
  {
    section: "faq",
    key: "f3",
    data: {
      question: "Who can read my conversations?",
      answer: "The members of the room. A private room does not appear in the public directory, and only rooms explicitly marked as showcase rooms can display their latest messages on the home page.",
    },
  },
  {
    section: "faq",
    key: "f5",
    data: {
      question: "Which platforms are supported?",
      answer: "The web, on every modern browser, from phones to desktop computers. Your session and your rooms follow you from one device to another.",
    },
  },
  {
    section: "authBenefit",
    key: "friends",
    data: {
      title: "Your friends, wherever they are",
      description: "Find your rooms and conversations from any device, with nothing to set up again.",
      icon: "users",
    },
  },
  {
    section: "authBenefit",
    key: "translate",
    data: {
      title: "Everyone in their own language",
      description: "Your country's language becomes your profile's language: your friends know where you are writing from.",
      icon: "translate",
    },
  },
  {
    section: "authBenefit",
    key: "secure",
    data: {
      title: "A verified address",
      description: "A six-digit code confirms your email before your first sign-in. Nobody can sign up in your place.",
      icon: "lock",
    },
  },
  {
    section: "metric",
    key: "latency",
    data: {
      title: "Median response time",
      detail: "Measured on requests actually served by the API over the last 30 days.",
      source: "latency",
      suffix: " ms",
    },
  },
  {
    section: "metric",
    key: "uptime",
    data: {
      title: "Measured uptime",
      detail: "Share of time the API responded, checked by a heartbeat every minute.",
      source: "uptime",
      suffix: " %",
    },
  },
  {
    section: "metric",
    key: "languages",
    data: {
      title: "Languages spoken by members",
      detail: "Inferred from each account's country, they flag the original language of messages.",
      source: "languages",
      suffix: "",
    },
  },
  {
    section: "metric",
    key: "messagesToday",
    data: {
      title: "Messages exchanged today",
      detail: "Since midnight, server time, across all rooms.",
      source: "messagesToday",
      suffix: "",
    },
  },
  {
    section: "securityPoint",
    key: "s1",
    data: { text: "Exchanges encrypted with TLS between your browser and the server" },
  },
  {
    section: "securityPoint",
    key: "s2",
    data: { text: "No ads, no reselling, no behavioral profiling" },
  },
  {
    section: "securityPoint",
    key: "s3",
    data: { text: "Passwords stored as bcrypt hashes, never in plain text" },
  },
  {
    section: "securityPoint",
    key: "s4",
    data: { text: "Email address confirmed by code before the first sign-in" },
  },
  {
    section: "securityPoint",
    key: "s5",
    data: { text: "Private rooms invisible to anyone outside their members" },
  },
  {
    section: "securityPoint",
    key: "s6",
    data: { text: "Permanent account deletion on request to the administrators" },
  },
  {
    section: "securityRow",
    key: "r1",
    data: { label: "Message transport", value: "TLS" },
  },
  {
    section: "securityRow",
    key: "r2",
    data: { label: "Passwords", value: "bcrypt" },
  },
  {
    section: "securityRow",
    key: "r3",
    data: { label: "Session", value: "Signed token" },
  },
  {
    section: "securityRow",
    key: "r4",
    data: { label: "Email address", value: "Confirmed" },
  },
  {
    section: "securityRow",
    key: "r5",
    data: { label: "Google sign-in", value: "Verified token" },
  },
  {
    section: "platform",
    key: "web",
    data: { label: "Web", detail: "Chrome, Firefox, Safari, Edge" },
  },
  {
    section: "platform",
    key: "mobile",
    data: { label: "Mobile", detail: "Interface adapted from 360 px wide" },
  },
  {
    section: "platform",
    key: "tablet",
    data: { label: "Tablet", detail: "Two-column layout" },
  },
  {
    section: "platform",
    key: "desktop",
    data: { label: "Desktop", detail: "Windows, macOS and Linux" },
  },
];
