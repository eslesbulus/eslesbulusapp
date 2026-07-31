const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * expo-audio's AudioRecordingService and AudioControlsService register
 * BOOT_COMPLETED intent-filters which are restricted on Android 15+.
 * This plugin strips those filters at build time so Google Play stops
 * flagging them. Audio recording still works normally; the services just
 * won't auto-start on device boot (which the app never needed anyway).
 */
const withFixAudioForegroundService = (config) => {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application?.service) return config;

    const RESTRICTED_SERVICES = [
      "expo.modules.audio.service.AudioRecordingService",
      "expo.modules.audio.service.AudioControlsService",
    ];

    application.service = application.service.map((service) => {
      const name = service.$?.["android:name"];
      if (!RESTRICTED_SERVICES.includes(name)) return service;

      if (service["intent-filter"]) {
        service["intent-filter"] = service["intent-filter"].filter((filter) => {
          const actions = filter.action ?? [];
          return !actions.some(
            (a) => a.$?.["android:name"] === "android.intent.action.BOOT_COMPLETED"
          );
        });
        if (service["intent-filter"].length === 0) {
          delete service["intent-filter"];
        }
      }

      return service;
    });

    return config;
  });
};

module.exports = withFixAudioForegroundService;
