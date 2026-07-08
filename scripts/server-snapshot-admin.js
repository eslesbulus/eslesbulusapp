const router = require("express").Router();
const mongoose = require("mongoose");
const os = require("os");
const { adminLogin, adminRequired } = require("../middleware/adminAuth");
const User = require("../models/User");
const Post = require("../models/Post");
const Chat = require("../models/Chat");
const Story = require("../models/Story");
const Notification = require("../models/Notification");
const { getRedis } = require("../utils/redis");
const { sendPushNotification } = require("../utils/pushNotify");
const { clearSettingsCache } = require("../middleware/maintenance");
const { generateProfiles } = require("../data/fakeProfiles");
const crypto = require("crypto");

// ── Login ──
router.post("/login", adminLogin);

// Tum admin endpointleri icin auth
router.use(adminRequired);

// ════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════
router.get("/dashboard", async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const [
      totalUsers,
      todayUsers,
      weekUsers,
      onlineUsers,
      totalPosts,
      todayPosts,
      totalChats,
      totalStories,
      premiumUsers,
      totalTokens,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ online: true }),
      Post.countDocuments(),
      Post.countDocuments({ createdAt: { $gte: todayStart } }),
      Chat.countDocuments(),
      Story.countDocuments(),
      User.countDocuments({ isPremium: true }),
      User.aggregate([{ $group: { _id: null, total: { $sum: "$tokens" } } }]),
    ]);

    // Toplam mesaj sayisi
    const msgAgg = await Chat.aggregate([
      { $project: { count: { $size: "$messages" } } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);
    const totalMessages = msgAgg[0]?.total || 0;

    // Socket baglanti sayisi
    let connectedSockets = 0;
    if (global._io) {
      connectedSockets = global._io.engine?.clientsCount || 0;
    }

    // Gender counts
    const genderAgg = await User.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } }
    ]);
    const genderMap = {};
    genderAgg.forEach(g => { genderMap[g._id || 'Diger'] = g.count; });

    // Fake user count
    const fakeUsers = await User.countDocuments({ role: { $in: ['fake-bot', 'fake-manual'] } });

    // Maintenance & bot status
    const { getSettings } = require("../middleware/maintenance");
    const settings = await getSettings();

    res.json({
      totalUsers,
      todayRegistrations: todayUsers,
      todayUsers,
      weekUsers,
      onlineUsers,
      totalPosts,
      todayPosts,
      totalChats,
      totalMessages,
      totalStories,
      premiumUsers,
      fakeUsers,
      totalTokensInCirculation: totalTokens[0]?.total || 0,
      connectedSockets,
      genderMale: genderMap['Erkek'] || 0,
      genderFemale: (genderMap['Kadin'] || 0) + (genderMap['Kadın'] || 0),
      genderOther: (genderMap['Diger'] || 0) + (genderMap['Diğer'] || 0) + (genderMap[''] || 0),
      botEnabled: settings?.botEnabled || false,
      maintenanceMode: settings?.maintenanceMode || false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
//  ANALYTICS
// ════════════════════════════════════════════
router.get("/analytics", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 86400000);

    // Gunluk kayit trendi
    const registrationTrend = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Gunluk mesaj trendi
    const messageTrend = await Chat.aggregate([
      { $unwind: "$messages" },
      { $match: { "messages.createdAt": { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$messages.createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Gunluk post trendi
    const postTrend = await Post.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Cinsiyet dagilimi
    const genderDist = await User.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    // Sehir dagilimi (ilk 10)
    const cityDist = await User.aggregate([
      { $match: { city: { $ne: "" } } },
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({ registrationTrend, messageTrend, postTrend, genderDist, cityDist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
//  USERS
// ════════════════════════════════════════════
router.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { uid: search },
      ];
    }

    if (req.query.status === "online") filter.online = true;
    if (req.query.status === "premium") filter.isPremium = true;
    if (req.query.status === "banned") filter.banned = true;
    if (req.query.gender) filter.gender = req.query.gender;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("uid name email photoURL gender city age online isPremium tokens banned suspended verified createdAt lastActive photos")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid }).lean();
    if (!user) return res.status(404).json({ error: "Kullanici bulunamadi" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/users/:uid", async (req, res) => {
  try {
    const allowed = ["banned", "suspended", "isPremium", "premiumExpiry", "tokens", "verified", "vip"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const user = await User.findOneAndUpdate({ uid: req.params.uid }, update, { new: true }).lean();
    if (!user) return res.status(404).json({ error: "Kullanici bulunamadi" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
//  POSTS
// ════════════════════════════════════════════
router.get("/posts", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.userId) filter.userId = req.query.userId;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    // Kullanici bilgilerini ekle
    const userIds = [...new Set(posts.map(p => p.userId))];
    const users = await User.find({ uid: { $in: userIds } }).select("uid name photoURL").lean();
    const userMap = {};
    users.forEach(u => { userMap[u.uid] = u; });

    const enriched = posts.map(p => ({
      ...p,
      user: userMap[p.userId] || { uid: p.userId, name: "Bilinmeyen", photoURL: "" },
    }));

    res.json({ posts: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/posts/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
//  CHATS / MESSAGES
// ════════════════════════════════════════════
router.get("/chats", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.search) {
      // Kullanici uid ile ara
      filter.participants = req.query.search;
    }

    const [chats, total] = await Promise.all([
      Chat.find(filter)
        .select("chatKey participants lastMessage lastMessageAt lastSenderId createdAt")
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Chat.countDocuments(filter),
    ]);

    // Katilimci bilgileri
    const allUids = [...new Set(chats.flatMap(c => c.participants))];
    const users = await User.find({ uid: { $in: allUids } }).select("uid name photoURL").lean();
    const userMap = {};
    users.forEach(u => { userMap[u.uid] = u; });

    const enriched = chats.map(c => ({
      ...c,
      participantDetails: c.participants.map(uid => userMap[uid] || { uid, name: "Bilinmeyen" }),
    }));

    res.json({ chats: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/chats/:chatKey/messages", async (req, res) => {
  try {
    const chat = await Chat.findOne({ chatKey: req.params.chatKey }).lean();
    if (!chat) return res.status(404).json({ error: "Sohbet bulunamadi" });

    const allUids = [...new Set(chat.messages.map(m => m.senderId))];
    const users = await User.find({ uid: { $in: allUids } }).select("uid name photoURL").lean();
    const userMap = {};
    users.forEach(u => { userMap[u.uid] = u; });

    const messages = chat.messages.map(m => ({
      ...m,
      senderName: userMap[m.senderId]?.name || m.senderId,
      senderPhoto: userMap[m.senderId]?.photoURL || "",
    }));

    res.json({ chatKey: chat.chatKey, participants: chat.participants, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/chats/:chatKey/messages/:msgId", async (req, res) => {
  try {
    await Chat.updateOne(
      { chatKey: req.params.chatKey },
      { $pull: { messages: { _id: req.params.msgId } } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
//  STORIES
// ════════════════════════════════════════════
router.get("/stories", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [stories, total] = await Promise.all([
      Story.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Story.countDocuments(),
    ]);

    const userIds = [...new Set(stories.map(s => s.userId))];
    const users = await User.find({ uid: { $in: userIds } }).select("uid name photoURL").lean();
    const userMap = {};
    users.forEach(u => { userMap[u.uid] = u; });

    const enriched = stories.map(s => ({
      ...s,
      user: userMap[s.userId] || { uid: s.userId, name: "Bilinmeyen" },
      likesCount: s.likedBy?.length || 0,
      repliesCount: s.replies?.length || 0,
    }));

    res.json({ stories: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/stories/:id", async (req, res) => {
  try {
    await Story.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
//  REPORTS (Sikayet sistemi)
// ════════════════════════════════════════════
// Report modeli henuz yok, olusturacagiz
let Report;
try {
  Report = mongoose.model("Report");
} catch {
  const reportSchema = new mongoose.Schema({
    reporterUid: { type: String, required: true },
    reportedUid: { type: String, default: "" },
    reportedPostId: { type: String, default: "" },
    reportedMessageId: { type: String, default: "" },
    type: { type: String, enum: ["user", "post", "message", "story"], default: "user" },
    reason: { type: String, required: true },
    details: { type: String, default: "" },
    status: { type: String, enum: ["pending", "reviewed", "resolved", "dismissed"], default: "pending" },
    adminNote: { type: String, default: "" },
    actionTaken: { type: String, default: "" },
  }, { timestamps: true });
  Report = mongoose.model("Report", reportSchema);
}

router.get("/reports", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    const [reports, total] = await Promise.all([
      Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Report.countDocuments(filter),
    ]);

    // Kullanici bilgileri
    const uids = [...new Set(reports.flatMap(r => [r.reporterUid, r.reportedUid].filter(Boolean)))];
    const users = await User.find({ uid: { $in: uids } }).select("uid name photoURL").lean();
    const userMap = {};
    users.forEach(u => { userMap[u.uid] = u; });

    const enriched = reports.map(r => ({
      ...r,
      reporter: userMap[r.reporterUid] || { uid: r.reporterUid, name: "Bilinmeyen" },
      reported: userMap[r.reportedUid] || { uid: r.reportedUid, name: "Bilinmeyen" },
    }));

    res.json({ reports: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/reports/:id", async (req, res) => {
  try {
    const { status, adminNote, actionTaken } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (actionTaken !== undefined) update.actionTaken = actionTaken;

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!report) return res.status(404).json({ error: "Rapor bulunamadi" });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
//  PUSH NOTIFICATIONS (Toplu)
// ════════════════════════════════════════════
router.post("/notifications/send", async (req, res) => {
  try {
    const { title, body, target } = req.body;
    // target: "all" | "premium" | { uids: [...] }

    let users;
    if (target === "all") {
      users = await User.find({ "pushTokens.0": { $exists: true } }).select("uid pushTokens name").lean();
    } else if (target === "premium") {
      users = await User.find({ isPremium: true, "pushTokens.0": { $exists: true } }).select("uid pushTokens name").lean();
    } else if (target?.uids) {
      users = await User.find({ uid: { $in: target.uids }, "pushTokens.0": { $exists: true } }).select("uid pushTokens name").lean();
    } else {
      return res.status(400).json({ error: "Gecersiz hedef" });
    }

    let sent = 0;
    for (const user of users) {
      for (const pt of user.pushTokens) {
        try {
          await sendPushNotification({
            toUid: user.uid,
            type: "admin",
            fromUid: "admin",
            fromName: "EslesBulus",
            fromPhoto: "",
            text: body || title || "",
            title: title,
          });
          sent++;
          break; // Kullanici basina 1 bildirim
        } catch {}
      }
    }

    res.json({ ok: true, sent, total: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
//  GIFTS
// ════════════════════════════════════════════
let Gift;
try {
  Gift = mongoose.model("Gift");
} catch {
  const giftSchema = new mongoose.Schema({
    name:    { type: String, required: true },
    emoji:   { type: String, required: true },
    price:   { type: Number, required: true },
    color:   { type: String, default: "#FF6B6B" },
    active:  { type: Boolean, default: true },
    order:   { type: Number, default: 0 },
  }, { timestamps: true });
  Gift = mongoose.model("Gift", giftSchema);
}

router.get("/gifts", async (req, res) => {
  try {
    const gifts = await Gift.find().sort({ order: 1 }).lean();

    // Hediye istatistikleri — en cok gonderilen
    const giftStats = await Chat.aggregate([
      { $unwind: "$messages" },
      { $match: { "messages.type": "gift" } },
      { $group: { _id: "$messages.gift.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ gifts, stats: giftStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/gifts", async (req, res) => {
  try {
    const gift = await Gift.create(req.body);
    res.json(gift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/gifts/:id", async (req, res) => {
  try {
    const gift = await Gift.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.json(gift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/gifts/:id", async (req, res) => {
  try {
    await Gift.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
//  SYSTEM STATUS
// ════════════════════════════════════════════
router.get("/system", async (req, res) => {
  try {
    const redis = getRedis();

    // MongoDB durum
    const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    // Redis durum
    let redisStatus = "disconnected";
    let redisInfo = {};
    try {
      const info = await redis.info("memory");
      redisStatus = "connected";
      const memMatch = info.match(/used_memory_human:(.+)/);
      redisInfo.memory = memMatch ? memMatch[1].trim() : "?";
    } catch {}

    // OS bilgileri
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const uptime = os.uptime();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // MongoDB stats
    let dbStats = {};
    try {
      dbStats = await mongoose.connection.db.stats();
    } catch {}

    // PM2 — socket count
    let connectedSockets = 0;
    if (global._io) {
      connectedSockets = global._io.engine?.clientsCount || 0;
    }

    // Online kullanici sayisi (Redis)
    let onlineCount = 0;
    try {
      const keys = await redis.keys("online:*");
      onlineCount = keys.length;
    } catch {}

    res.json({
      server: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: Math.floor(uptime),
        nodeVersion: process.version,
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model || "?",
        loadAvg: { "1m": loadAvg[0]?.toFixed(2), "5m": loadAvg[1]?.toFixed(2), "15m": loadAvg[2]?.toFixed(2) },
      },
      memory: {
        total: (totalMem / 1073741824).toFixed(2) + " GB",
        free: (freeMem / 1073741824).toFixed(2) + " GB",
        used: ((totalMem - freeMem) / 1073741824).toFixed(2) + " GB",
        usagePercent: (((totalMem - freeMem) / totalMem) * 100).toFixed(1),
      },
      mongodb: {
        status: mongoStatus,
        dbSize: dbStats.dataSize ? (dbStats.dataSize / 1048576).toFixed(2) + " MB" : "?",
        collections: dbStats.collections || 0,
        documents: dbStats.objects || 0,
      },
      redis: {
        status: redisStatus,
        memory: redisInfo.memory || "?",
      },
      sockets: {
        connected: connectedSockets,
        onlineUsers: onlineCount,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
//  APP SETTINGS
// ════════════════════════════════════════════
let AppSettings;
try {
  AppSettings = mongoose.model("AppSettings");
} catch {
  const settingsSchema = new mongoose.Schema({
    key: { type: String, default: "main", unique: true },
    maintenanceMode: { type: Boolean, default: false },
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
  }, { timestamps: true });
  AppSettings = mongoose.model("AppSettings", settingsSchema);
}

router.get("/settings", async (req, res) => {
  try {
    let settings = await AppSettings.findOne({ key: "main" }).lean();
    if (!settings) {
      settings = await AppSettings.create({ key: "main" });
      settings = settings.toObject();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const update = { ...req.body };
    delete update.key;
    delete update._id;
    const settings = await AppSettings.findOneAndUpdate(
      { key: "main" },
      update,
      { new: true, upsert: true }
    ).lean();
    clearSettingsCache();

    // Bakim modu degistiyse tum bagli kullanicilara anlik bildir
    if (update.maintenanceMode !== undefined && global._io) {
      global._io.emit("app:maintenance", {
        maintenance: !!settings.maintenanceMode,
        message: settings.maintenanceMessage || "",
        endDate: settings.maintenanceEndDate || null,
      });
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════
//  FAKE KULLANICI YONETIMI
// ════════════════════════════════════════════

// Toplu fake kullanici olustur
router.post("/fake-users/generate", async (req, res) => {
  try {
    const count = Math.min(parseInt(req.body.count) || 5, 50); // max 50
    const role = req.body.role || "fake-bot"; // fake-bot veya fake-manual
    const profiles = generateProfiles(count);

    const created = [];
    for (const p of profiles) {
      const uid = `fake_${crypto.randomBytes(8).toString("hex")}`;
      const user = await User.create({
        uid,
        name: `${p.name} ${p.surname}`,
        email: `${uid}@fake.eslesbulus.com`,
        gender: p.gender,
        age: p.age,
        birthDate: p.birthDate,
        city: p.city,
        job: p.job,
        bio: p.bio,
        height: p.height,
        interests: p.interests,
        role,
        profileComplete: true,
        online: true,
        lastActive: new Date(),
        verified: true,
        photos: [],
        photoURL: "",
        tokens: 9999,
      });
      created.push({
        uid: user.uid,
        name: user.name,
        age: user.age,
        city: user.city,
        role: user.role,
      });
    }

    res.json({ created, count: created.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fake kullanicilari listele
router.get("/fake-users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = { role: { $in: ["fake-bot", "fake-manual"] } };

    if (req.query.role) filter.role = req.query.role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("uid name photoURL gender city age role online photos bio job interests height")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fake kullanici guncelle (profil, role, fotolar)
router.patch("/fake-users/:uid", async (req, res) => {
  try {
    const allowed = ["name", "age", "city", "bio", "job", "height", "interests", "gender",
                      "role", "online", "photos", "photoURL", "verified", "vip", "isPremium"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid, role: { $in: ["fake-bot", "fake-manual"] } },
      update,
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: "Fake kullanici bulunamadi" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fake kullanici sil
router.delete("/fake-users/:uid", async (req, res) => {
  try {
    await User.deleteOne({ uid: req.params.uid, role: { $in: ["fake-bot", "fake-manual"] } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fake kullanici fotograf yukle
router.post("/fake-users/:uid/photos", async (req, res) => {
  try {
    const { photos } = req.body; // array of URLs
    if (!photos || !Array.isArray(photos)) return res.status(400).json({ error: "photos array gerekli" });

    const user = await User.findOneAndUpdate(
      { uid: req.params.uid, role: { $in: ["fake-bot", "fake-manual"] } },
      {
        $push: { photos: { $each: photos } },
        $set: { photoURL: photos[0] || "" },
      },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: "Fake kullanici bulunamadi" });

    // photoURL yoksa ilk fotoyu koy
    if (!user.photoURL && user.photos.length > 0) {
      await User.updateOne({ uid: req.params.uid }, { photoURL: user.photos[0] });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Bot AI test endpoint — gercek API ile test
router.post("/bot-test", async (req, res) => {
  try {
    const { getBotResponse } = require("../utils/botAI");
    const { getSettings } = require("../middleware/maintenance");
    const settings = await getSettings();

    const { message, botName, botAge, botCity, userName, dialog } = req.body;

    if (!message) return res.status(400).json({ error: "Mesaj gerekli" });

    const start = Date.now();
    const response = await getBotResponse({
      senderId: "admin-test",
      receiverId: "bot-test",
      message,
      dialog: dialog || "admin-test-session",
      botDetails: {
        bot_isim: botName || "Cansu",
        bot_yas: String(botAge || "24"),
        bot_sehir: botCity || "Istanbul",
      },
      userName: userName || "Admin",
      apiUrl: settings.botApiUrl || undefined,
      apiKey: settings.botApiKey || undefined,
    });

    const latency = Date.now() - start;

    if (response) {
      res.json({ response, latency });
    } else {
      res.json({ error: "AI yanit vermedi. API baglantisini kontrol edin.", latency });
    }
  } catch (err) {
    console.error("[bot-test] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
