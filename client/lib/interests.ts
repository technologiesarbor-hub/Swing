/**
 * Interests / hashtags — stored on the server as a comma-separated string.
 * UI works with tag arrays at the edges only.
 */

const MAX_TAGS = 8;

export function parseInterests(csv: string | undefined | null): string[] {
  if (!csv?.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of csv.split(',')) {
    const tag = part.trim().toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

export function joinInterests(tags: string[]): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out.join(',');
}
