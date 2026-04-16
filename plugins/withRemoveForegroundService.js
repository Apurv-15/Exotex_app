const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withRemoveForegroundService(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    
    // Remove specific services that might trigger foreground service requirements
    if (mainApplication.service) {
      mainApplication.service = mainApplication.service.filter((service) => {
        const name = service.$['android:name'];
        // Remove services related to audio background playback and data sync
        // which are common causes for foreground service rejections
        const isOffending = 
          name.includes('expo.modules.audio.AudioForegroundService') || 
          name.includes('expo.modules.audio.BackgroundAudioService') ||
          name.includes('expo.modules.updates.UpdatesService') ||
          name.includes('com.google.android.gms.metadata.ModuleDependencies'); // Sometimes added by dependencies

        return !isOffending;
      });
    }

    // Ensure permissions are also removed at the manifest level just in case blockPermissions fails
    if (config.modResults.manifest['uses-permission']) {
      config.modResults.manifest['uses-permission'] = config.modResults.manifest['uses-permission'].filter((permission) => {
        const name = permission.$['android:name'];
        return !name.includes('FOREGROUND_SERVICE');
      });
    }

    return config;
  });
};
