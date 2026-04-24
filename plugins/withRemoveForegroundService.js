const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withRemoveForegroundService(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    
    console.log('--- withRemoveForegroundService: Starting Manifest Cleanup ---');

    // 1. Remove specific services that are known to use foreground services
    if (mainApplication.service) {
      const initialCount = mainApplication.service.length;
      mainApplication.service = mainApplication.service.filter((service) => {
        const name = service.$['android:name'] || '';
        const isOffending = 
          name.includes('expo.modules.audio.AudioForegroundService') || 
          name.includes('expo.modules.audio.BackgroundAudioService') ||
          name.includes('expo.modules.audio.service.AudioRecordingService') || 
          name.includes('expo.modules.audio.service.AudioControlsService') ||
          name.includes('expo.modules.updates.UpdatesService') ||
          name.includes('com.google.android.gms.metadata.ModuleDependencies');

        if (isOffending) console.log(`Removing offending service: ${name}`);
        return !isOffending;
      });
      console.log(`Removed ${initialCount - mainApplication.service.length} services.`);

      // 2. For any remaining services, strip the foregroundServiceType attribute
      mainApplication.service.forEach((service) => {
        if (service.$ && service.$['android:foregroundServiceType']) {
          console.log(`Stripping foregroundServiceType from: ${service.$['android:name']}`);
          delete service.$['android:foregroundServiceType'];
        }
      });
    }

    // 2b. Remove BOOT_COMPLETED broadcast receivers
    if (mainApplication.receiver) {
      const initialReceivers = mainApplication.receiver.length;
      mainApplication.receiver = mainApplication.receiver.filter((receiver) => {
        const hasBootIntent = receiver['intent-filter']?.some((filter) => 
          filter.action?.some((action) => action.$['android:name'] === 'android.intent.action.BOOT_COMPLETED')
        );
        if (hasBootIntent) console.log(`Removing BOOT_COMPLETED receiver: ${receiver.$['android:name']}`);
        return !hasBootIntent;
      });
      console.log(`Removed ${initialReceivers - mainApplication.receiver.length} boot receivers.`);
    }

    // 3. Strip all FOREGROUND_SERVICE and BOOT_COMPLETED related permissions
    if (config.modResults.manifest['uses-permission']) {
      const initialPerms = config.modResults.manifest['uses-permission'].length;
      config.modResults.manifest['uses-permission'] = config.modResults.manifest['uses-permission'].filter((permission) => {
        const name = permission.$['android:name'] || '';
        const isOffending = name.includes('FOREGROUND_SERVICE') || name.includes('RECEIVE_BOOT_COMPLETED');
        if (isOffending) console.log(`Stripping permission: ${name}`);
        return !isOffending;
      });
      console.log(`Stripped ${initialPerms - config.modResults.manifest['uses-permission'].length} offending permissions.`);
    }

    console.log('--- withRemoveForegroundService: Cleanup Complete ---');
    return config;
  });
};

