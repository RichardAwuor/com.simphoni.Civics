
const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin to ensure AndroidManifest.xml uses the correct theme
 * and doesn't reference Material3 Expressive themes
 */
module.exports = function withCustomAndroidManifest(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Ensure the application uses our AppTheme
    if (mainApplication.$) {
      mainApplication.$['android:theme'] = '@style/Theme.App.SplashScreen';
    }

    // Find and update all activity themes
    if (mainApplication.activity) {
      mainApplication.activity.forEach((activity) => {
        if (activity.$ && activity.$['android:theme']) {
          // Replace any Material3 Expressive theme references with AppTheme
          const currentTheme = activity.$['android:theme'];
          if (currentTheme.includes('Material3Expressive')) {
            activity.$['android:theme'] = '@style/AppTheme';
            console.log(`✅ Replaced Material3Expressive theme in activity: ${activity.$['android:name']}`);
          }
        }
      });
    }

    console.log('✅ AndroidManifest.xml configured with correct themes');

    return config;
  });
};
