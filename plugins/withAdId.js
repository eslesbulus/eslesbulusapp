const { withAndroidManifest } = require("@expo/config-plugins");

const withAdId = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }
    const already = manifest["uses-permission"].some(
      (p) => p.$?.["android:name"] === "com.google.android.gms.permission.AD_ID"
    );
    if (!already) {
      manifest["uses-permission"].push({
        $: { "android:name": "com.google.android.gms.permission.AD_ID" },
      });
    }
    return config;
  });
};

module.exports = withAdId;
