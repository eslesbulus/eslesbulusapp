const mongoose = require("mongoose");

const GIFTS = [
  { id: "rose", name: "Gül", emoji: "🌹", price: 5, rarity: "common", color: "#EF4444" },
  { id: "kiss", name: "Öpücük", emoji: "💋", price: 8, rarity: "common", color: "#EC4899" },
  { id: "choco", name: "Çikolata", emoji: "🍫", price: 10, rarity: "common", color: "#92400E" },
  { id: "coffee", name: "Kahve", emoji: "☕", price: 12, rarity: "common", color: "#78350F" },
  { id: "bear", name: "Ayıcık", emoji: "🧸", price: 25, rarity: "rare", color: "#B45309" },
  { id: "wine", name: "Şarap", emoji: "🍷", price: 30, rarity: "rare", color: "#7F1D1D" },
  { id: "star", name: "Yıldız", emoji: "🌟", price: 20, rarity: "rare", color: "#F59E0B" },
  { id: "unicorn", name: "Unicorn", emoji: "🦄", price: 75, rarity: "rare", color: "#A855F7" },
  { id: "rocket", name: "Roket", emoji: "🚀", price: 100, rarity: "epic", color: "#3B82F6" },
  { id: "trophy", name: "Kupa", emoji: "🏆", price: 150, rarity: "epic", color: "#EAB308" },
  { id: "diamond", name: "Elmas", emoji: "💎", price: 200, rarity: "epic", color: "#06B6D4" },
  { id: "ring", name: "Yüzük", emoji: "💍", price: 250, rarity: "epic", color: "#F0ABFC" },
  { id: "crown", name: "Taç", emoji: "👑", price: 500, rarity: "legendary", color: "#FBBF24" },
  { id: "car", name: "Spor Araba", emoji: "🏎️", price: 1000, rarity: "legendary", color: "#DC2626" },
  { id: "castle", name: "Kale", emoji: "🏰", price: 2000, rarity: "legendary", color: "#7C3AED" },
];

const VIP_GIFTS = [
  { id: "vip-lambo", name: "Lamborghini", emoji: "🏎️", price: 500, rarity: "legendary", color: "#FFD700" },
  { id: "vip-yacht", name: "Yat", emoji: "🛥️", price: 800, rarity: "legendary", color: "#0EA5E9" },
  { id: "vip-jet", name: "Özel Jet", emoji: "✈️", price: 1200, rarity: "legendary", color: "#6366F1" },
  { id: "vip-hearts", name: "Kalp Yağmuru", emoji: "💖", price: 300, rarity: "epic", color: "#EC4899" },
  { id: "vip-fireworks", name: "Havai Fişek", emoji: "🎆", price: 400, rarity: "epic", color: "#F59E0B" },
  { id: "vip-mansion", name: "Malikane", emoji: "🏰", price: 2000, rarity: "legendary", color: "#A855F7" },
  { id: "vip-roses", name: "Gül Buketi", emoji: "💐", price: 200, rarity: "epic", color: "#F43F5E" },
  { id: "vip-galaxy", name: "Galaksi", emoji: "🌌", price: 1500, rarity: "legendary", color: "#8B5CF6" },
];

const giftSchema = new mongoose.Schema({
  giftId:  { type: String, default: "" },
  name:    { type: String, required: true },
  emoji:   { type: String, required: true },
  price:   { type: Number, required: true },
  color:   { type: String, default: "#FF6B6B" },
  rarity:  { type: String, default: "common" },
  vip:     { type: Boolean, default: false },
  active:  { type: Boolean, default: true },
  order:   { type: Number, default: 0 },
}, { timestamps: true });

const Gift = mongoose.models.Gift || mongoose.model("Gift", giftSchema);

(async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/eslesbulus");

  let order = 0;
  let upserts = 0;
  const all = [
    ...GIFTS.map(g => ({ ...g, vip: false })),
    ...VIP_GIFTS.map(g => ({ ...g, vip: true })),
  ];

  for (const g of all) {
    await Gift.updateOne(
      { giftId: g.id },
      {
        $set: {
          giftId: g.id,
          name: g.name,
          emoji: g.emoji,
          price: g.price,
          color: g.color,
          rarity: g.rarity,
          vip: g.vip,
          active: true,
          order: order++,
        },
      },
      { upsert: true }
    );
    upserts++;
  }

  const total = await Gift.countDocuments();
  console.log(`Seeded/updated ${upserts} gifts. Total in DB: ${total}`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
