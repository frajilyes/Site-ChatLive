import type { ContentSection, IconName, MetricSource } from '../../types'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'icon'
  | 'metric'
  | 'lines'
  | 'links'

export interface FieldSpec {
  readonly key: string
  readonly label: string
  readonly type: FieldType
  readonly hint?: string
  readonly required?: boolean
}

export interface SectionSpec {
  readonly section: ContentSection
  readonly label: string
  readonly description: string
  readonly titleField: string
  readonly fields: readonly FieldSpec[]
}

export const ICON_NAMES: readonly IconName[] = [
  'home',
  'sparkles',
  'chat',
  'globe',
  'tag',
  'users',
  'mail',
  'shield',
  'bolt',
  'translate',
  'video',
  'lock',
  'device',
  'check',
  'arrow-right',
  'send',
  'search',
  'star',
  'heart',
  'user',
  'user-plus',
  'log-in',
  'github',
  'x',
  'linkedin',
  'discord',
]

export const METRIC_SOURCES: readonly { value: MetricSource; label: string }[] = [
  { value: 'users', label: 'Registered accounts' },
  { value: 'onlineUsers', label: 'Members online' },
  { value: 'countries', label: 'Countries represented' },
  { value: 'languages', label: 'Languages spoken' },
  { value: 'messages', label: 'Messages (total)' },
  { value: 'messages30d', label: 'Messages (last 30 days)' },
  { value: 'messagesToday', label: 'Messages (today)' },
  { value: 'rooms', label: 'Rooms (all)' },
  { value: 'publicRooms', label: 'Public rooms' },
  { value: 'communities', label: 'Communities' },
  { value: 'uptime', label: 'Measured uptime (%)' },
  { value: 'latency', label: 'Median response time (ms)' },
  { value: 'rating', label: 'Average testimonial rating' },
  { value: 'testimonials', label: 'Published testimonials' },
]

const TITLE: FieldSpec = { key: 'title', label: 'Title', type: 'text', required: true }
const DESCRIPTION: FieldSpec = {
  key: 'description',
  label: 'Description',
  type: 'textarea',
  required: true,
}

export const SECTIONS: readonly SectionSpec[] = [
  {
    section: 'navItem',
    label: 'Navigation',
    description: 'The entries of the main menu and the mobile drawer.',
    titleField: 'label',
    fields: [
      { key: 'label', label: 'Label', type: 'text', required: true },
      { key: 'path', label: 'Path', type: 'text', required: true, hint: 'For example /pricing' },
      { key: 'description', label: 'Subtitle (mobile menu)', type: 'text' },
      { key: 'icon', label: 'Icon', type: 'icon' },
      {
        key: 'children',
        label: 'Submenu',
        type: 'links',
        hint: 'Leave empty for an entry without a dropdown.',
      },
    ],
  },
  {
    section: 'footerColumn',
    label: 'Footer columns',
    description: 'Each column has its title and its links.',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Column title', type: 'text', required: true },
      { key: 'links', label: 'Links', type: 'links' },
    ],
  },
  {
    section: 'socialLink',
    label: 'Social networks',
    description: 'The badges shown below the pitch, in the footer.',
    titleField: 'label',
    fields: [
      { key: 'label', label: 'Network name', type: 'text', required: true },
      { key: 'href', label: 'Address', type: 'text', required: true },
      { key: 'icon', label: 'Icon', type: 'icon' },
    ],
  },
  {
    section: 'stat',
    label: 'Home page figures',
    description:
      'The band below the hero section. The value is not entered: it is measured from the database on every load.',
    titleField: 'label',
    fields: [
      { key: 'label', label: 'Label', type: 'text', required: true },
      { key: 'source', label: 'Displayed measurement', type: 'metric', required: true },
      { key: 'suffix', label: 'Suffix', type: 'text', hint: 'For example % or M' },
      {
        key: 'to',
        label: 'Linked page',
        type: 'text',
        hint: 'The figure becomes a link to this page. Empty: plain counter.',
      },
    ],
  },
  {
    section: 'feature',
    label: 'Features',
    description: 'The cards on the home page and the Features page.',
    titleField: 'title',
    fields: [
      TITLE,
      DESCRIPTION,
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'tag', label: 'Tag', type: 'text' },
      {
        key: 'to',
        label: 'Linked page',
        type: 'text',
        hint: 'The card becomes a link to this page. Empty: plain card.',
      },
    ],
  },
  {
    section: 'step',
    label: 'Getting started steps',
    description: 'The numbered list on the home page.',
    titleField: 'title',
    fields: [
      { key: 'index', label: 'Number', type: 'text', hint: 'For example 01' },
      TITLE,
      DESCRIPTION,
      {
        key: 'to',
        label: 'Linked page',
        type: 'text',
        hint: 'Where the step is completed. Empty: step without a button.',
      },
      { key: 'cta', label: 'Link label', type: 'text', hint: 'For example Create my account' },
    ],
  },
  {
    section: 'value',
    label: 'Values',
    description: 'The three cards at the top of the About page.',
    titleField: 'title',
    fields: [TITLE, DESCRIPTION],
  },
  {
    section: 'plan',
    label: 'Plans',
    description: 'The plans on the Pricing page.',
    titleField: 'name',
    fields: [
      { key: 'name', label: 'Plan name', type: 'text', required: true },
      { key: 'tagline', label: 'Tagline', type: 'text', required: true },
      { key: 'priceMonthly', label: 'Monthly price (EUR)', type: 'number' },
      { key: 'priceYearly', label: 'Yearly price (EUR)', type: 'number' },
      {
        key: 'features',
        label: 'What the plan includes',
        type: 'lines',
        hint: 'One line per item.',
      },
      { key: 'highlighted', label: 'Highlighted (“most popular”)', type: 'boolean' },
      { key: 'cta', label: 'Button text', type: 'text', required: true },
      { key: 'ctaTo', label: 'Button destination', type: 'text', required: true },
    ],
  },
  {
    section: 'faq',
    label: 'Frequently asked questions',
    description: 'The accordion at the bottom of the Pricing page.',
    titleField: 'question',
    fields: [
      { key: 'question', label: 'Question', type: 'text', required: true },
      { key: 'answer', label: 'Answer', type: 'textarea', required: true },
    ],
  },
  {
    section: 'team',
    label: 'Team',
    description: 'The profiles on the About page.',
    titleField: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text', required: true },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'initials', label: 'Initials', type: 'text', hint: 'Two letters.' },
      { key: 'bio', label: 'Bio', type: 'textarea' },
    ],
  },
  {
    section: 'milestone',
    label: 'Milestones',
    description: 'The timeline on the About page.',
    titleField: 'title',
    fields: [
      { key: 'year', label: 'Year', type: 'text', required: true },
      TITLE,
      DESCRIPTION,
    ],
  },
  {
    section: 'contactChannel',
    label: 'Contact channels',
    description: 'The cards to the right of the contact form.',
    titleField: 'title',
    fields: [
      TITLE,
      { key: 'detail', label: 'Email address', type: 'text', required: true },
      { key: 'hint', label: 'Details', type: 'text' },
      { key: 'icon', label: 'Icon', type: 'icon' },
    ],
  },
  {
    section: 'office',
    label: 'Offices',
    description: 'The “Our offices” list on the Contact page.',
    titleField: 'city',
    fields: [
      { key: 'city', label: 'City', type: 'text', required: true },
      { key: 'country', label: 'Country', type: 'text', required: true },
      { key: 'timezone', label: 'Time zone', type: 'text', hint: 'For example UTC+1' },
      { key: 'flag', label: 'Country code', type: 'text', hint: 'Two letters, for example PT' },
    ],
  },
  {
    section: 'authBenefit',
    label: 'Benefits (sign-in)',
    description: 'The column shown next to the sign-in and sign-up forms.',
    titleField: 'title',
    fields: [TITLE, DESCRIPTION, { key: 'icon', label: 'Icon', type: 'icon' }],
  },
  {
    section: 'metric',
    label: 'Measured indicators',
    description:
      'The four “Performance” cards on the Features page. The value is measured, not entered.',
    titleField: 'title',
    fields: [
      TITLE,
      { key: 'detail', label: 'Explanation', type: 'textarea', required: true },
      { key: 'source', label: 'Displayed measurement', type: 'metric', required: true },
      { key: 'suffix', label: 'Suffix', type: 'text', hint: 'For example “ms” or “%”' },
    ],
  },
  {
    section: 'securityPoint',
    label: 'Privacy points',
    description: 'The checklist on the Features page.',
    titleField: 'text',
    fields: [{ key: 'text', label: 'Text', type: 'textarea', required: true }],
  },
  {
    section: 'securityRow',
    label: 'Security log',
    description: 'The two-column table on the Features page.',
    titleField: 'label',
    fields: [
      { key: 'label', label: 'Mechanism', type: 'text', required: true },
      { key: 'value', label: 'Status', type: 'text', required: true },
    ],
  },
  {
    section: 'platform',
    label: 'Platforms',
    description: 'The “Available everywhere” cards.',
    titleField: 'label',
    fields: [
      { key: 'label', label: 'Platform', type: 'text', required: true },
      { key: 'detail', label: 'Details', type: 'text', required: true },
    ],
  },
]

export function titleOf(spec: SectionSpec, data: Record<string, unknown>): string {
  const value = data[spec.titleField]
  return typeof value === 'string' && value.trim() ? value : '(untitled)'
}

export function specOf(section: ContentSection): SectionSpec {
  const spec = SECTIONS.find((entry) => entry.section === section)
  if (!spec) throw new Error(`Unknown section: ${section}`)
  return spec
}
