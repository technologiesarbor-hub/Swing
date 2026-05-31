/**
 * Display initials from a name:
 *   - One word ("rahul", "rahul ") → first letter only ("R")
 *   - Two+ words split on spaces ("rahul saw") → first + last word ("RS")
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}
