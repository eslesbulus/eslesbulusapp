/**
 * Returns the age in full years for a given birth date.
 * Accounts for whether the birthday has occurred yet this calendar year.
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

/**
 * Parses an ISO yyyy-mm-dd string into a Date, or null if invalid/empty.
 */
export function parseISODate(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Convenience: age from ISO yyyy-mm-dd string (returns null if invalid).
 */
export function ageFromISO(iso: string | undefined | null): number | null {
  const d = parseISODate(iso);
  return d ? calculateAge(d) : null;
}
