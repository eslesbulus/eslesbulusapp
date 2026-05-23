const router = require("express").Router();
const { authRequired } = require("../middleware/auth");
const User = require("../models/User");
const { sendPushNotification } = require("../utils/pushNotify");

// GET /api/users
router.get("/", authRequired, async (req, res) => {
  const filter = { uid: { $ne: req.uid } };
  if (req.query.includeIncomplete !== "true") {
    filter.profileComplete = true;
  }
  const users = await User.find(filter)
    .select("-blockedUsers -sentHis -pushTokens -__v").lean();
  res.json(users);
});

// GET /api/users/me/liked-by
router.get("/me/liked-by", authRequired, async (req, res) => {
  try {
    const users = await User.find(
      { "likedUsers.uid": req.uid, profileComplete: true },
      { uid: 1, name: 1, photoURL: 1, photos: 1, city: 1, gender: 1, bio: 1, vip: 1, online: 1, age: 1, _id: 0 }
    ).lean();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/me/viewers
router.get("/me/viewers", authRequired, async (req, res) => {
  try {
    const me = await User.findOne({ uid: req.uid }, { viewedBy: 1 }).lean();
    if (!me || !me.viewedBy || me.viewedBy.length === 0) return res.json([]);
    const viewerUids = me.viewedBy.map(v => v.uid);
    const users = await User.find(
      { uid: { $in: viewerUids }, profileComplete: true },
      { uid: 1, name: 1, photoURL: 1, photos: 1, city: 1, gender: 1, bio: 1, vip: 1, online: 1, age: 1, _id: 0 }
    ).lean();
    res.json(users);
  } catch (e) {
    res.json([]);
  }
});

// GET /api/users/:uid
router.get("/:uid", authRequired, async (req, res) => {
  const user = await User.findOne({ uid: req.params.uid })
    .select("-blockedUsers -sentHis -pushTokens -__v").lean();
  if (!user) return res.status(404).json({ error: "Kullanici bulunamadi" });
  res.json(user);
});

// PUT /api/users/me
router.put("/me", authRequired, async (req, res) => {
  const allowed = [
    "name","photoURL","birthDate","age","gender","bio","city",
    "photos","interests","job","height","profileComplete",
    "isPremium","premiumExpiry","vip","tokens",
    "dailyLikesUsed","dailyHisUsed","dailyStoryLikesUsed","dailyResetDate"
  ];
  const update = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) update[k] = req.body[k];
  }
  const user = await User.findOneAndUpdate(
    { uid: req.uid }, update, { returnDocument: 'after' }
  ).select("-__v");
  res.json(user);
});

// POST /api/users/me/send-hi
router.post("/me/send-hi", authRequired, async (req, res) => {
  const { userId, messageId, text, emoji } = req.body;
  await User.updateOne(
    { uid: req.uid },
    { $push: { sentHis: { userId, messageId, text, emoji, at: new Date() } } }
  );
  // Push bildirim
  const sender = await User.findOne({ uid: req.uid }).select("name photoURL photos").lean();
  sendPushNotification({
    toUid: userId,
    type: "hi",
    fromUid: req.uid,
    fromName: sender?.name || "",
    fromPhoto: sender?.photoURL || (sender?.photos && sender.photos[0]) || "",
    text: text || emoji || "Hi!",
  }).catch(err => console.error("Push error (hi):", err));
  res.json({ ok: true });
});

// POST /api/users/me/toggle-like
router.post("/me/toggle-like", authRequired, async (req, res) => {
  const { targetUid } = req.body;
  const user = await User.findOne({ uid: req.uid });
  if (!user) return res.status(404).json({ error: "User not found" });

  const idx = user.likedUsers.findIndex(l => l.uid === targetUid);
  if (idx >= 0) {
    user.likedUsers.splice(idx, 1);
    await user.save();
    res.json({ liked: false });
  } else {
    user.likedUsers.push({ uid: targetUid, at: new Date() });
    await user.save();
    // Push bildirim
    sendPushNotification({
      toUid: targetUid,
      type: "like",
      fromUid: req.uid,
      fromName: user.name || "",
      fromPhoto: user.photoURL || (user.photos && user.photos[0]) || "",
      text: "",
    }).catch(err => console.error("Push error (like):", err));
    res.json({ liked: true });
  }
});

// POST /api/users/me/block
router.post("/me/block", authRequired, async (req, res) => {
  const { targetUid, name, photo } = req.body;
  await User.updateOne(
    { uid: req.uid },
    { $push: { blockedUsers: { uid: targetUid, name, photo, at: new Date() } } }
  );
  res.json({ ok: true });
});

// POST /api/users/me/unblock
router.post("/me/unblock", authRequired, async (req, res) => {
  const { targetUid } = req.body;
  await User.updateOne(
    { uid: req.uid },
    { $pull: { blockedUsers: { uid: targetUid } } }
  );
  res.json({ ok: true });
});

// POST /api/users/me/push-token
router.post("/me/push-token", authRequired, async (req, res) => {
  try {
    const { token, platform } = req.body;
    const uid = req.uid;
    await User.findOneAndUpdate({ uid }, { $pull: { pushTokens: { token } } });
    await User.findOneAndUpdate({ uid }, {
      $push: {
        pushTokens: {
          $each: [{ token, platform, updatedAt: new Date() }],
          $slice: -5,
        },
      },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:uid/view
router.post("/:uid/view", authRequired, async (req, res) => {
  try {
    if (req.uid === req.params.uid) return res.json({ ok: true });
    await User.updateOne(
      { uid: req.params.uid },
      { $pull: { viewedBy: { uid: req.uid } } }
    );
    await User.updateOne(
      { uid: req.params.uid },
      { $push: { viewedBy: { $each: [{ uid: req.uid, at: new Date() }], $slice: -50 } } }
    );
    // Push bildirim
    const sender = await User.findOne({ uid: req.uid }).select("name photoURL photos").lean();
    sendPushNotification({
      toUid: req.params.uid,
      type: "profile_view",
      fromUid: req.uid,
      fromName: sender?.name || "",
      fromPhoto: sender?.photoURL || (sender?.photos && sender.photos[0]) || "",
      text: "",
    }).catch(err => console.error("Push error (view):", err));
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: true });
  }
});

module.exports = router;
