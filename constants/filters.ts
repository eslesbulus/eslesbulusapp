import type { UserProfile } from "@/context/AuthContext";

export type Gender = "Erkek" | "Kadın" | "Diğer";

export type Filters = {
  ageMin: number;
  ageMax: number;
  gender: "all" | Gender;
  cities: string[];
  onlineOnly: boolean;
  verifiedOnly: boolean;
};

export const DEFAULT_FILTERS: Filters = {
  ageMin: 18,
  ageMax: 65,
  gender: "all",
  cities: [],
  onlineOnly: false,
  verifiedOnly: false,
};

export const AGE_BOUND = { min: 18, max: 65 };

export function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.ageMin !== DEFAULT_FILTERS.ageMin || f.ageMax !== DEFAULT_FILTERS.ageMax) n++;
  if (f.gender !== "all") n++;
  if (f.cities.length > 0) n++;
  if (f.onlineOnly) n++;
  if (f.verifiedOnly) n++;
  return n;
}

export function applyFilters(users: UserProfile[], f: Filters): UserProfile[] {
  return users.filter((u) => {
    const age = u.age ?? 0;
    if (age < f.ageMin || age > f.ageMax) return false;
    if (f.gender !== "all" && u.gender !== f.gender) return false;
    if (f.cities.length > 0 && (!u.city || !f.cities.includes(u.city))) return false;
    if (f.onlineOnly && !u.online) return false;
    if (f.verifiedOnly && !u.verified) return false;
    return true;
  });
}
