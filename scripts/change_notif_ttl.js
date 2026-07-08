const m = require("mongoose");
m.connect("mongodb://localhost:27017/eslesbulus").then(async () => {
  const db = m.connection.db;
  // Mevcut TTL index'lerini bul
  const idx = await db.collection("notifications").indexes();
  console.log("indexes:", idx.map(i => i.name + (i.expireAfterSeconds != null ? " (TTL " + i.expireAfterSeconds + "s)" : "")).join(", "));

  // createdAt TTL index'ini 7 güne çek (collMod — drop gerekmez)
  try {
    const res = await db.command({
      collMod: "notifications",
      index: { keyPattern: { createdAt: 1 }, expireAfterSeconds: 7 * 86400 },
    });
    console.log("collMod OK:", JSON.stringify(res));
  } catch (e) {
    console.log("collMod failed (" + e.message + "), trying drop+recreate...");
    try { await db.collection("notifications").dropIndex("createdAt_1"); } catch (e2) { console.log("drop:", e2.message); }
    await db.collection("notifications").createIndex({ createdAt: 1 }, { expireAfterSeconds: 7 * 86400 });
    console.log("recreated 7-day TTL index");
  }

  // 7 günden eski olanları hemen temizle (TTL arka planda dakikada bir çalışır)
  const cutoff = new Date(Date.now() - 7 * 86400 * 1000);
  const del = await db.collection("notifications").deleteMany({ createdAt: { $lt: cutoff } });
  console.log("deleted old (>7d):", del.deletedCount);

  await m.disconnect();
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
