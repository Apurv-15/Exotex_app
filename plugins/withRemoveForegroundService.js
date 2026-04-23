const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withRemoveForegroundService(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    
    // 1. Remove specific services that are known to use foreground services
    if (mainApplication.service) {
      mainApplication.service = mainApplication.service.filter((service) => {
        const name = service.$['android:name'] || '';
        const isOffending = 
          name.includes('expo.modules.audio.AudioForegroundService') || 
          name.includes('expo.modules.audio.BackgroundAudioService') ||
          name.includes('expo.modules.updates.UpdatesService') ||
          name.includes('com.google.android.gms.metadata.ModuleDependencies');

        return !isOffending;
      });

      // 2. For any remaining services, strip the foregroundServiceType attribute
      mainApplication.service.forEach((service) => {
        if (service.$ && service.$['android:foregroundServiceType']) {
          delete service.$['android:foregroundServiceType'];
        }
      });
    }

    // 3. Strip all FOREGROUND_SERVICE related permissions
    if (config.modResults.manifest['uses-permission']) {
      config.modResults.manifest['uses-permission'] = config.modResults.manifest['uses-permission'].filter((permission) => {
        const name = permission.$['android:name'] || '';
        return !name.includes('FOREGROUND_SERVICE');
      });
    }

    return config;
  });
};

