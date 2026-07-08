require("dotenv").config({ quiet: true });
const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const { initRedis } = require("./utils/redis");
const { initFirebaseAdmin } = require("./utils/firebase");
const { setupSocket } = require("./socket/handler");
const { maintenanceCheck } = require("./middleware/maintenance");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Firebase Admin init
initFirebaseAdmin();

// Admin Panel API (bakim modundan muaf)
app.use("/admin/api", require("./routes/admin"));

// Admin Panel Static (bakim modundan muaf)
app.use("/adminpanel", express.static(path.join(__dirname, "public/admin")));

// Bakim modu kontrolu — admin haricindeki tum /api/* istekleri icin
app.use(maintenanceCheck);

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", ts: Date.now() });
});

app.use("/api/auth",    require("./routes/auth"));
app.use("/api/users",   require("./routes/users"));
app.use("/api/posts",   require("./routes/posts"));
app.use("/api/stories", require("./routes/stories"));
app.use("/api/chats",   require("./routes/chats"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/upload",  require("./routes/upload"));

// Socket.IO
const io = new Server(server, {
  cors: { origin: "*" },
  pingInterval: 25000,
  pingTimeout: 60000,
});
setupSocket(io);

// Connect & Start
async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[MongoDB] connected");

  await initRedis();
  console.log("[Redis] connected");

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`[API] running on :${PORT}`));
}

start().catch((e) => { console.error(e); process.exit(1); });
