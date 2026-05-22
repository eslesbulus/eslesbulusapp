export type Gift = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  color: string; // accent color for glow
  particles?: string[]; // extra emojis that fly out during animation
};

export const GIFTS: Gift[] = [
  // Common
  { id: "rose", name: "Gül", emoji: "🌹", price: 5, rarity: "common", color: "#EF4444", particles: ["🌸", "🌺"] },
  { id: "kiss", name: "Öpücük", emoji: "💋", price: 8, rarity: "common", color: "#EC4899", particles: ["💕", "💗"] },
  { id: "choco", name: "Çikolata", emoji: "🍫", price: 10, rarity: "common", color: "#92400E", particles: ["✨", "💝"] },
  { id: "coffee", name: "Kahve", emoji: "☕", price: 12, rarity: "common", color: "#78350F", particles: ["🍪", "✨"] },

  // Rare
  { id: "bear", name: "Ayıcık", emoji: "🧸", price: 25, rarity: "rare", color: "#B45309", particles: ["💕", "🎀"] },
  { id: "wine", name: "Şarap", emoji: "🍷", price: 30, rarity: "rare", color: "#7F1D1D", particles: ["🌹", "✨"] },
  { id: "star", name: "Yıldız", emoji: "🌟", price: 20, rarity: "rare", color: "#F59E0B", particles: ["✨", "⭐"] },
  { id: "unicorn", name: "Unicorn", emoji: "🦄", price: 75, rarity: "rare", color: "#A855F7", particles: ["🌈", "✨"] },

  // Epic
  { id: "rocket", name: "Roket", emoji: "🚀", price: 100, rarity: "epic", color: "#3B82F6", particles: ["🔥", "✨", "💫"] },
  { id: "trophy", name: "Kupa", emoji: "🏆", price: 150, rarity: "epic", color: "#EAB308", particles: ["✨", "🌟", "💫"] },
  { id: "diamond", name: "Elmas", emoji: "💎", price: 200, rarity: "epic", color: "#06B6D4", particles: ["✨", "💠", "💎"] },
  { id: "ring", name: "Yüzük", emoji: "💍", price: 250, rarity: "epic", color: "#F0ABFC", particles: ["💖", "✨", "💕"] },

  // Legendary
  { id: "crown", name: "Taç", emoji: "👑", price: 500, rarity: "legendary", color: "#FBBF24", particles: ["✨", "💫", "🌟", "⭐"] },
  { id: "car", name: "Spor Araba", emoji: "🏎️", price: 1000, rarity: "legendary", color: "#DC2626", particles: ["💨", "🔥", "✨", "💫"] },
  { id: "castle", name: "Kale", emoji: "🏰", price: 2000, rarity: "legendary", color: "#7C3AED", particles: ["✨", "👑", "💎", "🌟"] },
];

/** VIP-only exclusive gifts — extra animations, higher prices */
export const VIP_GIFTS: Gift[] = [
  { id: "vip-lambo", name: "Lamborghini", emoji: "🏎️", price: 500, rarity: "legendary", color: "#FFD700", particles: ["💨", "🔥", "✨", "💫", "🏁"] },
  { id: "vip-yacht", name: "Yat", emoji: "🛥️", price: 800, rarity: "legendary", color: "#0EA5E9", particles: ["🌊", "☀️", "✨", "🐬", "🌴"] },
  { id: "vip-jet", name: "Özel Jet", emoji: "✈️", price: 1200, rarity: "legendary", color: "#6366F1", particles: ["☁️", "✨", "🌟", "💫", "🌈"] },
  { id: "vip-hearts", name: "Kalp Yağmuru", emoji: "💖", price: 300, rarity: "epic", color: "#EC4899", particles: ["❤️", "💕", "💗", "💓", "💞", "💝", "💘"] },
  { id: "vip-fireworks", name: "Havai Fişek", emoji: "🎆", price: 400, rarity: "epic", color: "#F59E0B", particles: ["🎇", "✨", "🌟", "💫", "🎉", "🎊"] },
  { id: "vip-mansion", name: "Malikane", emoji: "🏰", price: 2000, rarity: "legendary", color: "#A855F7", particles: ["👑", "💎", "✨", "🌟", "🏛️", "💫"] },
  { id: "vip-roses", name: "Gül Buketi", emoji: "💐", price: 200, rarity: "epic", color: "#F43F5E", particles: ["🌹", "🌸", "🌺", "💕", "✨"] },
  { id: "vip-galaxy", name: "Galaksi", emoji: "🌌", price: 1500, rarity: "legendary", color: "#8B5CF6", particles: ["⭐", "🌟", "💫", "✨", "🪐", "🌠"] },
];

export const EMOJI_CATEGORIES: { id: string; label: string; emojis: string[] }[] = [
  {
    id: "love",
    label: "Aşk",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💖", "💗", "💓", "💞", "💕", "💝", "💟", "❣️", "💘", "💌", "💋", "👄", "💍", "💎", "🌹"],
  },
  {
    id: "happy",
    label: "Mutlu",
    emojis: ["😍", "🥰", "😘", "😗", "😙", "😚", "🤗", "🤩", "😊", "☺️", "😌", "😏", "😉", "😎", "🤤", "😋", "😛", "😜", "😝", "🤪", "🥳", "🤭", "😻", "😽"],
  },
  {
    id: "fun",
    label: "Eğlence",
    emojis: ["😂", "🤣", "😅", "😄", "😆", "😁", "🙃", "🙂", "😇", "🤠", "🥸", "🤡", "🎉", "🎊", "🎁", "🎈", "🎂", "🍰", "🥂", "🍾", "🍻", "🍹", "🍸", "🎵"],
  },
  {
    id: "nature",
    label: "Doğa",
    emojis: ["🌸", "🌺", "🌻", "🌼", "🌷", "🌹", "🥀", "💐", "🌱", "🌿", "🍀", "🌳", "🌴", "🌵", "🌾", "🌊", "⛱️", "🏖️", "🌅", "🌄", "🌠", "🌌", "🌈", "☀️"],
  },
  {
    id: "anim",
    label: "Hayvan",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🦄", "🐝", "🦋", "🐬", "🐳", "🦒", "🐘", "🦁"],
  },
  {
    id: "gesture",
    label: "El",
    emojis: ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "✋", "🤚", "🖐️", "🖖", "👋", "🤝", "🙏", "✍️", "💪", "🦾"],
  },
];
