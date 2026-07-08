const jwt = require("jsonwebtoken");

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "EslesBulus2024!";
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

function adminLogin(req, res) {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ role: "admin", user: username }, JWT_SECRET, { expiresIn: "24h" });
    return res.json({ token, expiresIn: 86400 });
  }
  return res.status(401).json({ error: "Gecersiz kullanici adi veya sifre" });
}

function adminRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Admin token gerekli" });
  }
  try {
    const decoded = jwt.verify(header.split(" ")[1], JWT_SECRET);
    if (decoded.role !== "admin") throw new Error("Not admin");
    req.adminUser = decoded.user;
    next();
  } catch {
    return res.status(401).json({ error: "Gecersiz veya suresi dolmus token" });
  }
}

module.exports = { adminLogin, adminRequired };
