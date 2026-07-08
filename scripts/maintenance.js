const mongoose = require("mongoose");

let AppSettings;
try {
  AppSettings = mongoose.model("AppSettings");
} catch {
  const settingsSchema = new mongoose.Schema({
    key: { type: String, default: "main", unique: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "" },
    maintenanceEndDate: { type: Date, default: null },
    registrationEnabled: { type: Boolean, default: true },
    minAge: { type: Number, default: 18 },
    maxDistance: { type: Number, default: 100 },
    dailyLikeLimit: { type: Number, default: 10 },
    dailyHiLimit: { type: Number, default: 5 },
    dailyStoryLikeLimit: { type: Number, default: 20 },
    messageTokenCost: { type: Number, default: 0 },
    premiumMonthlyPrice: { type: Number, default: 99.99 },
    premiumYearlyPrice: { type: Number, default: 599.99 },
    defaultTokens: { type: Number, default: 100 },
    giftEnabled: { type: Boolean, default: true },
    storyEnabled: { type: Boolean, default: true },
    announcementText: { type: String, default: "" },
    // Bot AI ayarlari
    botEnabled: { type: Boolean, default: false },
    botApiUrl: { type: String, default: "https://dp.apis.net.tr/v3beta" },
    botApiKey: { type: String, default: "001a06d11bb9cc731a266cea1124b00e" },
    botResponseDelayMin: { type: Number, default: 1000 },
    botResponseDelayMax: { type: Number, default: 3000 },
  }, { timestamps: true });
  AppSettings = mongoose.model("AppSettings", settingsSchema);
}

let cachedSettings = null;
let cacheTime = 0;
const CACHE_TTL = 30000;

async function getSettings() {
  const now = Date.now();
  if (cachedSettings && (now - cacheTime) < CACHE_TTL) {
    return cachedSettings;
  }
  try {
    cachedSettings = await AppSettings.findOne({ key: "main" }).lean();
    if (!cachedSettings) {
      cachedSettings = await AppSettings.create({ key: "main" });
      cachedSettings = cachedSettings.toObject();
    }
    cacheTime = now;
  } catch {}
  return cachedSettings;
}

function clearSettingsCache() {
  cachedSettings = null;
  cacheTime = 0;
}

// Sadece /api/maintenance/status endpoint'i — API engelleme YOK
async function maintenanceCheck(req, res, next) {
  if (req.path === "/api/maintenance/status") {
    const settings = await getSettings();
    return res.json({
      maintenance: !!(settings && settings.maintenanceMode),
      message: settings?.maintenanceMessage || "",
      endDate: settings?.maintenanceEndDate || null,
    });
  }
  next();
}

module.exports = { maintenanceCheck, getSettings, clearSettingsCache };
