import { Gender, MockUser } from "./mockUsers";

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

export function applyFilters(users: MockUser[], f: Filters): MockUser[] {
  return users.filter((u) => {
    if (u.age < f.ageMin || u.age > f.ageMax) return false;
    if (f.gender !== "all" && u.gender !== f.gender) return false;
    if (f.cities.length > 0 && !f.cities.includes(u.city)) return false;
    if (f.onlineOnly && !u.online) return false;
    if (f.verifiedOnly && !u.verified) return false;
    return true;
  });
}
