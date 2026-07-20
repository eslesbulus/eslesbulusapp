import type { TranslationKeys } from "@/i18n/tr";

export type Gift = {
  id: string;
  nameKey: TranslationKeys;
  emoji: string;
  price: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  color: string;
  particles?: string[];
};

export const GIFTS: Gift[] = [
  // Common
  { id: "rose", nameKey: "gift_rose", emoji: "🌹", price: 5, rarity: "common", color: "#EF4444", particles: ["🌸", "🌺"] },
  { id: "kiss", nameKey: "gift_kiss", emoji: "💋", price: 8, rarity: "common", color: "#EC4899", particles: ["💕", "💗"] },
  { id: "choco", nameKey: "gift_chocolate", emoji: "🍫", price: 10, rarity: "common", color: "#92400E", particles: ["✨", "💝"] },
  { id: "coffee", nameKey: "gift_coffee", emoji: "☕", price: 12, rarity: "common", color: "#78350F", particles: ["🍪", "✨"] },

  // Rare
  { id: "bear", nameKey: "gift_teddy", emoji: "🧸", price: 25, rarity: "rare", color: "#B45309", particles: ["💕", "🎀"] },
  { id: "wine", nameKey: "gift_wine", emoji: "🍷", price: 30, rarity: "rare", color: "#7F1D1D", particles: ["🌹", "✨"] },
  { id: "star", nameKey: "gift_star", emoji: "🌟", price: 20, rarity: "rare", color: "#F59E0B", particles: ["✨", "⭐"] },
  { id: "unicorn", nameKey: "gift_teddy", emoji: "🦄", price: 75, rarity: "rare", color: "#A855F7", particles: ["🌈", "✨"] },

  // Epic
  { id: "rocket", nameKey: "gift_rocket", emoji: "🚀", price: 100, rarity: "epic", color: "#3B82F6", particles: ["🔥", "✨", "💫"] },
  { id: "trophy", nameKey: "gift_cup", emoji: "🏆", price: 150, rarity: "epic", color: "#EAB308", particles: ["✨", "🌟", "💫"] },
  { id: "diamond", nameKey: "gift_diamond", emoji: "💎", price: 200, rarity: "epic", color: "#06B6D4", particles: ["✨", "💠", "💎"] },
  { id: "ring", nameKey: "gift_ring", emoji: "💍", price: 250, rarity: "epic", color: "#F0ABFC", particles: ["💖", "✨", "💕"] },

  // Legendary
  { id: "crown", nameKey: "gift_crown", emoji: "👑", price: 500, rarity: "legendary", color: "#FBBF24", particles: ["✨", "💫", "🌟", "⭐"] },
  { id: "car", nameKey: "gift_sports_car", emoji: "🏎️", price: 1000, rarity: "legendary", color: "#DC2626", particles: ["💨", "🔥", "✨", "💫"] },
  { id: "castle", nameKey: "gift_castle", emoji: "🏰", price: 2000, rarity: "legendary", color: "#7C3AED", particles: ["✨", "👑", "💎", "🌟"] },
];

/** VIP-only exclusive gifts — extra animations, higher prices */
export const VIP_GIFTS: Gift[] = [
  { id: "vip-lambo", nameKey: "gift_sports_car", emoji: "🏎️", price: 500, rarity: "legendary", color: "#FFD700", particles: ["💨", "🔥", "✨", "💫", "🏁"] },
  { id: "vip-yacht", nameKey: "gift_yacht", emoji: "🛥️", price: 800, rarity: "legendary", color: "#0EA5E9", particles: ["🌊", "☀️", "✨", "🐬", "🌴"] },
  { id: "vip-jet", nameKey: "gift_private_jet", emoji: "✈️", price: 1200, rarity: "legendary", color: "#6366F1", particles: ["☁️", "✨", "🌟", "💫", "🌈"] },
  { id: "vip-hearts", nameKey: "gift_heart_rain", emoji: "💖", price: 300, rarity: "epic", color: "#EC4899", particles: ["❤️", "💕", "💗", "💓", "💞", "💝", "💘"] },
  { id: "vip-fireworks", nameKey: "gift_fireworks", emoji: "🎆", price: 400, rarity: "epic", color: "#F59E0B", particles: ["🎇", "✨", "🌟", "💫", "🎉", "🎊"] },
  { id: "vip-mansion", nameKey: "gift_mansion", emoji: "🏰", price: 2000, rarity: "legendary", color: "#A855F7", particles: ["👑", "💎", "✨", "🌟", "🏛️", "💫"] },
  { id: "vip-roses", nameKey: "gift_bouquet", emoji: "💐", price: 200, rarity: "epic", color: "#F43F5E", particles: ["🌹", "🌸", "🌺", "💕", "✨"] },
  { id: "vip-galaxy", nameKey: "gift_galaxy", emoji: "🌌", price: 1500, rarity: "legendary", color: "#8B5CF6", particles: ["⭐", "🌟", "💫", "✨", "🪐", "🌠"] },
];

export type EmojiCategory = { id: string; labelKey: TranslationKeys; emojis: string[] };

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "love",
    labelKey: "emoji_love",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💖", "💗", "💓", "💞", "💕", "💝", "💟", "❣️", "💘", "💌", "💋", "👄", "💍", "💎", "🌹"],
  },
  {
    id: "happy",
    labelKey: "emoji_happy",
    emojis: ["😍", "🥰", "😘", "😗", "😙", "😚", "🤗", "🤩", "😊", "☺️", "😌", "😏", "😉", "😎", "🤤", "😋", "😛", "😜", "😝", "🤪", "🥳", "🤭", "😻", "😽"],
  },
  {
    id: "fun",
    labelKey: "emoji_fun",
    emojis: ["😂", "🤣", "😅", "😄", "😆", "😁", "🙃", "🙂", "😇", "🤠", "🥸", "🤡", "🎉", "🎊", "🎁", "🎈", "🎂", "🍰", "🥂", "🍾", "🍻", "🍹", "🍸", "🎵"],
  },
  {
    id: "nature",
    labelKey: "emoji_nature",
    emojis: ["🌸", "🌺", "🌻", "🌼", "🌷", "🌹", "🥀", "💐", "🌱", "🌿", "🍀", "🌳", "🌴", "🌵", "🌾", "🌊", "⛱️", "🏖️", "🌅", "🌄", "🌠", "🌌", "🌈", "☀️"],
  },
  {
    id: "anim",
    labelKey: "emoji_animal",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🦄", "🐝", "🦋", "🐬", "🐳", "🦒", "🐘", "🦁"],
  },
  {
    id: "gesture",
    labelKey: "emoji_hand",
    emojis: ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "✋", "🤚", "🖐️", "🖖", "👋", "🤝", "🙏", "✍️", "💪", "🦾"],
  },
];
