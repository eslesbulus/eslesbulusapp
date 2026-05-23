const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const { authRequired } = require("../middleware/auth");

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/uploads";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB (video icin)
  fileFilter: (req, file, cb) => {
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.originalname) ||
                    file.mimetype.startsWith("image/");
    const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(file.originalname) ||
                    file.mimetype.startsWith("video/");
    cb(null, isImage || isVideo);
  },
});

// POST /api/upload/:folder  (avatars, photos, posts, stories, chat)
router.post("/:folder", authRequired, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Dosya gerekli" });

  const folder = req.params.folder;
  const allowed = ["avatars", "photos", "posts", "stories", "chat"];
  if (!allowed.includes(folder)) return res.status(400).json({ error: "Gecersiz klasor" });

  const dir = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const isVideo = req.file.mimetype.startsWith("video/");

  if (isVideo) {
    // Video — direkt kaydet (transcode yok)
    const ext = path.extname(req.file.originalname) || ".mp4";
    const filename = `${req.uid}_${Date.now()}${ext}`;
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, req.file.buffer);
    const url = `${process.env.BASE_URL}/uploads/${folder}/${filename}`;
    res.json({ url, filename, type: "video" });
  } else {
    // Image — resize & compress
    const filename = `${req.uid}_${Date.now()}.webp`;
    const filepath = path.join(dir, filename);
    await sharp(req.file.buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(filepath);
    const url = `${process.env.BASE_URL}/uploads/${folder}/${filename}`;
    res.json({ url, filename, type: "image" });
  }
});

module.exports = router;
