const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withRemoveAdIdPermission(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (manifest['uses-permission']) {
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (item) => item.$['android:name'] !== 'com.google.android.gms.permission.AD_ID',
      );
    }

    return config;
  });
};
