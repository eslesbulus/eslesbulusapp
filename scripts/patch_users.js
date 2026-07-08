const fs = require('fs');
let code = fs.readFileSync('/var/www/eslesbulus-api/src/routes/users.js', 'utf8');

const oldRoute = `router.get("/", authRequired, async (req, res) => {
  const filter = { uid: { $ne: req.uid } };
  if (req.query.includeIncomplete !== "true") {
    filter.profileComplete = true;
  }
  const users = await User.find(filter)
    .select("-blockedUsers -sentHis -pushTokens -role -__v").lean();
  res.json(users);
});`;

const newRoute = `router.get("/", authRequired, async (req, res) => {
  try {
    const filter = { uid: { $ne: req.uid } };
    if (req.query.includeIncomplete !== "true") {
      filter.profileComplete = true;
    }
    const users = await User.find(filter)
      .select("-blockedUsers -sentHis -pushTokens -role -__v").lean();
    console.log("[users] GET / uid=" + req.uid + " results=" + users.length);
    res.json(users);
  } catch (err) {
    console.error("[users] GET / error:", err.message);
    res.status(500).json({ error: "Sunucu hatasi" });
  }
});`;

if (code.includes(oldRoute)) {
  code = code.replace(oldRoute, newRoute);
  fs.writeFileSync('/var/www/eslesbulus-api/src/routes/users.js', code);
  console.log('Patched OK');
} else {
  console.log('Old route not found - may already be patched');
}
