const sharp = require("sharp");
const transp = "/tmp/transp.png";
const BG = { r: 0x44, g: 0x0d, b: 0x1e, alpha: 1 }; // #440d1e
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

(async () => {
  // 1) icon.png — logo art koyu-kırmızı zeminde, 1024 opak (iOS + Android legacy)
  const art1024 = await sharp(transp).resize(1024, 1024, { fit: "contain", background: TRANSPARENT }).png().toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: BG } })
    .composite([{ input: art1024, gravity: "center" }]).png().toFile("/tmp/out_icon.png");

  // 2) adaptive-icon.png — şeffaf zeminde logo art (bg config'ten #440d1e gelir)
  await sharp(transp).resize(1024, 1024, { fit: "contain", background: TRANSPARENT }).png().toFile("/tmp/out_adaptive.png");

  // 3) splash-icon.png — şeffaf zeminde logo art (splash bg #440d1e)
  await sharp(transp).resize(1024, 1024, { fit: "contain", background: TRANSPARENT }).png().toFile("/tmp/out_splash.png");

  // 4) notification-icon.png — Android küçük ikon: gerçek logonun alpha'sından beyaz silüet
  const size = 96;
  const alpha = await sharp(transp)
    .resize(size, size, { fit: "contain", background: TRANSPARENT })
    .ensureAlpha().extractChannel(3).raw().toBuffer();
  const white = await sharp({ create: { width: size, height: size, channels: 3, background: { r: 255, g: 255, b: 255 } } }).raw().toBuffer();
  await sharp(white, { raw: { width: size, height: size, channels: 3 } })
    .joinChannel(alpha, { raw: { width: size, height: size, channels: 1 } })
    .png().toFile("/tmp/out_notif.png");

  console.log("DONE");
})().catch(e => { console.error(e); process.exit(1); });
