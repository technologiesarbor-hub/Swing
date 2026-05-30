/**
 * A short list of supported countries (ISO-style names) for the
 * location picker on the edit-profile screen.
 *
 * Eventually this will be driven by a geo-detect call + a full IANA list,
 * but for MVP a curated subset is enough to ship the UX.
 */

export const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Singapore',
  'Japan',
  'South Korea',
  'Brazil',
  'Mexico',
  'Argentina',
  'United Arab Emirates',
  'Saudi Arabia',
  'South Africa',
  'Nigeria',
  'Kenya',
  'Indonesia',
  'Philippines',
  'Vietnam',
  'Thailand',
  'Turkey',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
] as const;

export type Country = (typeof COUNTRIES)[number];
