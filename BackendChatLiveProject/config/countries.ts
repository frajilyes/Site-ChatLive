import type { SignupCountry } from "../types/index";

export const COUNTRIES: readonly SignupCountry[] = Object.freeze([
  { code: "FR", name: "France", language: "French" },
  { code: "BE", name: "Belgium", language: "French" },
  { code: "CA", name: "Canada", language: "French" },
  { code: "CH", name: "Switzerland", language: "French" },
  { code: "MA", name: "Morocco", language: "Arabic" },
  { code: "TN", name: "Tunisia", language: "Arabic" },
  { code: "DZ", name: "Algeria", language: "Arabic" },
  { code: "SN", name: "Senegal", language: "French" },
  { code: "CI", name: "Ivory Coast", language: "French" },
  { code: "ES", name: "Spain", language: "Spanish" },
  { code: "MX", name: "Mexico", language: "Spanish" },
  { code: "PT", name: "Portugal", language: "Portuguese" },
  { code: "BR", name: "Brazil", language: "Portuguese" },
  { code: "IT", name: "Italy", language: "Italian" },
  { code: "DE", name: "Germany", language: "German" },
  { code: "GB", name: "United Kingdom", language: "English" },
  { code: "US", name: "United States", language: "English" },
  { code: "KE", name: "Kenya", language: "English" },
  { code: "NG", name: "Nigeria", language: "English" },
  { code: "TR", name: "Turkey", language: "Turkish" },
  { code: "IN", name: "India", language: "Hindi" },
  { code: "CN", name: "China", language: "Mandarin" },
  { code: "KR", name: "South Korea", language: "Korean" },
  { code: "JP", name: "Japan", language: "Japanese" },
]);

export const SITE_LANGUAGE = "English";

export const DEFAULT_COUNTRY: SignupCountry = COUNTRIES[0];

export const COUNTRY_NAMES: readonly string[] = COUNTRIES.map((country) => country.name);
export const COUNTRY_CODES: readonly string[] = COUNTRIES.map((country) => country.code);
export const LANGUAGES: readonly string[] = [
  ...new Set(COUNTRIES.map((country) => country.language)),
];

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['\u2019]/g, "'");
}

export function resolveCountry(value: unknown): SignupCountry {
  const needle = normalize(value);
  if (!needle) return DEFAULT_COUNTRY;
  return (
    COUNTRIES.find((country) => normalize(country.name) === needle) ??
    COUNTRIES.find((country) => normalize(country.code) === needle) ??
    DEFAULT_COUNTRY
  );
}

export function isKnownCountry(value: unknown): boolean {
  const needle = normalize(value);
  return COUNTRIES.some(
    (country) => normalize(country.name) === needle || normalize(country.code) === needle,
  );
}
