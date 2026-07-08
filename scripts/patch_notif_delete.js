const fs = require("fs");
const path = "/var/www/eslesbulus-api/src/routes/notifications.js";
let code = fs.readFileSync(path, "utf8");

const anchor = "module.exports = router;";
const additions = `// DELETE /api/notifications/:id — tek bildirim sil (sadece kendi bildirimi)
router.delete("/:id", authRequired, async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, toUid: req.uid });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications — kullanicinin tum bildirimlerini sil
router.delete("/", authRequired, async (req, res) => {
  try {
    await Notification.deleteMany({ toUid: req.uid });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;`;

if (code.includes("router.delete(\"/:id\"")) {
  console.log("notifications DELETE already present");
} else if (code.includes(anchor)) {
  code = code.replace(anchor, additions);
  fs.writeFileSync(path, code);
  console.log("notifications DELETE endpoints added");
} else {
  console.log("!! anchor not found in notifications.js");
}
