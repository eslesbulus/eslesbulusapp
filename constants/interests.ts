import type { TranslationKeys } from "@/i18n/tr";

export type Interest = {
  id: string;
  labelKey: TranslationKeys;
};

export const INTERESTS_LIST: Interest[] = [
  { id: "music", labelKey: "interest_music" },
  { id: "sports", labelKey: "interest_sports" },
  { id: "travel", labelKey: "interest_travel" },
  { id: "food", labelKey: "interest_food" },
  { id: "art", labelKey: "interest_art" },
  { id: "movies", labelKey: "interest_movies" },
  { id: "books", labelKey: "interest_books" },
  { id: "dance", labelKey: "interest_dance" },
  { id: "nature", labelKey: "interest_nature" },
  { id: "tech", labelKey: "interest_tech" },
  { id: "photography", labelKey: "interest_photography" },
  { id: "yoga", labelKey: "interest_yoga" },
  { id: "gaming", labelKey: "interest_gaming" },
  { id: "fashion", labelKey: "interest_fashion" },
  { id: "wine", labelKey: "interest_wine" },
  { id: "coffee", labelKey: "interest_coffee" },
  { id: "cats", labelKey: "interest_cats" },
  { id: "dogs", labelKey: "interest_dogs" },
  { id: "theater", labelKey: "interest_theater" },
  { id: "concerts", labelKey: "interest_concerts" },
  { id: "swimming", labelKey: "interest_swimming" },
  { id: "running", labelKey: "interest_running" },
  { id: "hiking", labelKey: "interest_hiking" },
  { id: "cycling", labelKey: "interest_cycling" },
];

export const INTERESTS_MAX = 5;

const LEGACY_TR_MAP: Record<string, string> = {
  "Müzik": "music", "Spor": "sports", "Seyahat": "travel", "Yemek": "food",
  "Sanat": "art", "Film": "movies", "Kitap": "books", "Dans": "dance",
  "Doğa": "nature", "Teknoloji": "tech", "Fotoğraf": "photography", "Yoga": "yoga",
  "Oyun": "gaming", "Moda": "fashion", "Şarap": "wine", "Kahve": "coffee",
  "Kedi": "cats", "Köpek": "dogs", "Tiyatro": "theater", "Konser": "concerts",
  "Yüzme": "swimming", "Koşu": "running", "Yürüyüş": "hiking", "Bisiklet": "cycling",
};

const VALID_IDS = new Set(INTERESTS_LIST.map((i) => i.id));

export function migrateInterests(raw: string[]): string[] {
  return raw.map((s) => {
    if (VALID_IDS.has(s)) return s;
    return LEGACY_TR_MAP[s] ?? s;
  });
}

export function getInterestLabel(id: string, t: (key: TranslationKeys) => string): string {
  const migrated = VALID_IDS.has(id) ? id : (LEGACY_TR_MAP[id] ?? id);
  const item = INTERESTS_LIST.find((i) => i.id === migrated);
  return item ? t(item.labelKey) : id;
}
