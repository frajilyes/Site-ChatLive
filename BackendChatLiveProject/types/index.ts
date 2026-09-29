export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly description: string;
  readonly icon: IconName;
  readonly children?: readonly FooterLink[];
}

export interface FooterColumn {
  readonly id: string;
  readonly title: string;
  readonly links: readonly FooterLink[];
}

export interface SocialLink {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly icon: IconName;
}

export interface FooterLink {
  readonly label: string;
  readonly to: string;
  readonly external?: boolean;
}

export type IconName =
  | "home"
  | "sparkles"
  | "chat"
  | "globe"
  | "tag"
  | "users"
  | "mail"
  | "shield"
  | "bolt"
  | "translate"
  | "video"
  | "lock"
  | "device"
  | "check"
  | "arrow-right"
  | "send"
  | "search"
  | "menu"
  | "close"
  | "user"
  | "user-plus"
  | "log-in"
  | "log-out"
  | "eye"
  | "eye-off"
  | "sun"
  | "moon"
  | "plus"
  | "minus"
  | "star"
  | "heart"
  | "github"
  | "x"
  | "linkedin"
  | "discord";

export interface Feature {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: IconName;
  readonly tag: string;
  readonly to?: string;
}

export interface Stat {
  readonly id: string;
  readonly value: number;
  readonly suffix: string;
  readonly label: string;
  readonly source: MetricSource;
  readonly precision: number;
  readonly to?: string;
}

export interface Metric {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly value: number;
  readonly suffix: string;
  readonly source: MetricSource;
  readonly precision: number;
}

export type MetricSource =
  | "users"
  | "countries"
  | "languages"
  | "messages"
  | "messages30d"
  | "messagesToday"
  | "rooms"
  | "publicRooms"
  | "communities"
  | "onlineUsers"
  | "uptime"
  | "latency"
  | "rating"
  | "testimonials";

export type MetricValues = Readonly<Record<MetricSource, number>>;

export interface Step {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly description: string;
  readonly to?: string;
  readonly cta?: string;
}

export interface Testimonial {
  readonly id: string;
  readonly quote: string;
  readonly author: string;
  readonly role: string;
  readonly country: string;
  readonly flag: string;
  readonly rating: number;
  readonly createdAt: string;
}

export interface Plan {
  readonly id: string;
  readonly name: string;
  readonly priceMonthly: number;
  readonly priceYearly: number;
  readonly tagline: string;
  readonly features: readonly string[];
  readonly highlighted: boolean;
  readonly cta: string;
  readonly ctaTo: string;
}

export interface FaqItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

export interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly city: string;
  readonly initials: string;
  readonly bio: string;
}

export interface SiteValue {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface Milestone {
  readonly id: string;
  readonly year: string;
  readonly title: string;
  readonly description: string;
}

export interface Community {
  readonly id: string;
  readonly name: string;
  readonly topic: string;
  readonly description: string;
  readonly members: number;
  readonly online: number;
  readonly languages: readonly string[];
  readonly emoji: string;
  readonly featured: boolean;
}

export interface ContactChannel {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly hint: string;
  readonly icon: IconName;
}

export interface Office {
  readonly id: string;
  readonly city: string;
  readonly country: string;
  readonly timezone: string;
  readonly flag: string;
}

export interface AuthBenefit {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: IconName;
}

export interface SecurityPoint {
  readonly id: string;
  readonly text: string;
}

export interface SecurityRow {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

export interface Platform {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
}

export interface SignupCountry {
  readonly code: string;
  readonly name: string;
  readonly language: string;
}

export interface SiteIdentity {
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly email: string;
  readonly phone: string;
  readonly founded: number;
  readonly legalNote: string;
}

export interface ServiceStatus {
  readonly ok: boolean;
  readonly environment: string;
  readonly availability: number;
  readonly latencyMs: number;
  readonly uptimeSeconds: number;
  readonly timestamp: string;
}

export interface ShowcaseMessage {
  readonly id: string;
  readonly author: string;
  readonly initials: string;
  readonly flag: string;
  readonly body: string;
  readonly minutesAgo: number;
  readonly language: string;
  readonly translatedFrom?: string;
}

export interface Showcase {
  readonly room: {
    readonly id: string;
    readonly name: string;
    readonly emoji: string;
    readonly topic: string;
    readonly members: number;
    readonly online: number;
  } | null;
  readonly messages: readonly ShowcaseMessage[];
  readonly online: readonly ChatUser[];
  readonly places: readonly string[];
}

export interface ContentEntry {
  readonly id: string;
  readonly section: ContentSection;
  readonly key: string;
  readonly order: number;
  readonly published: boolean;
  readonly data: Record<string, unknown>;
  readonly updatedAt: string;
}

export type ContentSection =
  | "navItem"
  | "footerColumn"
  | "socialLink"
  | "stat"
  | "feature"
  | "step"
  | "value"
  | "plan"
  | "faq"
  | "team"
  | "milestone"
  | "contactChannel"
  | "office"
  | "authBenefit"
  | "metric"
  | "securityPoint"
  | "securityRow"
  | "platform";

export type TestimonialStatus = "pending" | "approved" | "rejected";

export interface AdminTestimonial {
  readonly id: string;
  readonly quote: string;
  readonly role: string;
  readonly rating: number;
  readonly status: TestimonialStatus;
  readonly createdAt: string;
  readonly author: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly initials: string;
    readonly country: string;
    readonly flag: string;
  } | null;
}

export interface SiteBundle {
  readonly site: SiteIdentity;
  readonly nav: readonly NavItem[];
  readonly footer: readonly FooterColumn[];
  readonly social: readonly SocialLink[];
  readonly features: readonly Feature[];
  readonly steps: readonly Step[];
  readonly values: readonly SiteValue[];
  readonly plans: readonly Plan[];
  readonly faq: readonly FaqItem[];
  readonly team: readonly TeamMember[];
  readonly milestones: readonly Milestone[];
  readonly contactChannels: readonly ContactChannel[];
  readonly offices: readonly Office[];
  readonly authBenefits: readonly AuthBenefit[];
  readonly metrics: readonly Metric[];
  readonly securityPoints: readonly SecurityPoint[];
  readonly securityRows: readonly SecurityRow[];
  readonly platforms: readonly Platform[];
  readonly stats: readonly Stat[];
  readonly testimonials: readonly Testimonial[];
  readonly contactSubjects: readonly string[];
  readonly countries: readonly SignupCountry[];
  readonly status: ServiceStatus;
}

export type Presence = "online" | "away" | "offline";

export interface ChatUser {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly country: string;
  readonly flag: string;
  readonly presence: Presence;
  readonly language: string;
  readonly roomRole?: MemberRole;
}

export type MemberRole = "owner" | "moderator" | "member";

export interface ChatMessage {
  readonly id: string;
  readonly roomId: string;
  readonly authorId: string;
  readonly body: string;
  readonly minutesAgo: number;
  readonly translatedFrom?: string;
  readonly createdAt?: string;
}

export interface ChatRoom {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly topic: string;
  readonly memberIds: readonly string[];
  readonly unread: number;
}

export type UserRole = "user" | "moderator" | "admin";

export type AuthProvider = "local" | "google";

export interface AuthUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly country: string;
  readonly flag: string;
  readonly language: string;
  readonly createdAt: string;
  readonly role: UserRole;
  readonly provider: AuthProvider;
}

export type RoomVisibility = "public" | "private";

export type ContactStatus = "new" | "read" | "answered";

export interface AdminContactMessage {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly subject: string;
  readonly message: string;
  readonly status: ContactStatus;
  readonly createdAt: string;
}

export interface ServiceHealth {
  readonly availability: number;
  readonly latencyMs: number;
  readonly requests: number;
  readonly uptimeSeconds: number;
}

export type ContentPayload = { id: string } & Record<string, unknown>;

export interface PendingVerification {
  readonly pendingVerification: true;
  readonly email: string;
  readonly delivered: boolean;
  readonly codeLength: number;
  readonly expiresInMinutes: number;
  readonly resendInSeconds: number;
}

export interface ErrorBody {
  success: false;
  message: string;
  field?: string;
  code?: string;
  retryAfter?: number;
  stack?: string;
}
