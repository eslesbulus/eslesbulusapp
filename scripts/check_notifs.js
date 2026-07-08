const m = require("mongoose");
m.connect("mongodb://localhost:27017/eslesbulus").then(async () => {
  const N = m.connection.db.collection("notifications");
  const adminTypes = { type: { $in: ["admin", "announcement", "system"] } };
  const count = await N.countDocuments(adminTypes);
  console.log("=== admin/announcement/system notification count:", count);
  const recent = await N.find(adminTypes).sort({ createdAt: -1 }).limit(8).toArray();
  recent.forEach(n => console.log(JSON.stringify({ to: n.toUid, type: n.type, title: n.title, text: n.text, read: n.read, createdAt: n.createdAt })));

  console.log("\n=== real users + push tokens ===");
  const U = m.connection.db.collection("users");
  const users = await U.find({ role: { $nin: ["fake-bot", "fake-manual"] } })
    .project({ uid: 1, name: 1, pushTokens: 1 }).toArray();
  users.forEach(u => console.log(u.name, "| uid:", u.uid.slice(0, 12), "| pushTokens:", (u.pushTokens || []).length));

  console.log("\n=== total notifications (all types) ===", await N.countDocuments());
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
