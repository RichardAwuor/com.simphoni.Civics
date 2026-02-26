
const { withAndroidStyles } = require('@expo/config-plugins');

/**
 * Config plugin to fix Android theme issues by ensuring we use standard AppCompat themes
 * instead of Material3 Expressive themes that don't exist in the Android SDK.
 */
module.exports = function withCustomAndroidStyles(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;

    // Ensure resources object exists
    if (!styles.resources) {
      styles.resources = {};
    }

    // Remove any Material3Expressive theme references and use standard AppCompat themes
    const appTheme = {
      $: {
        name: 'AppTheme',
        parent: 'Theme.AppCompat.DayNight.NoActionBar',
      },
      item: [
        {
          _: '@color/colorPrimaryDark',
          $: { name: 'android:statusBarColor' },
        },
        {
          _: '@color/colorPrimaryDark',
          $: { name: 'android:navigationBarColor' },
        },
        {
          _: 'false',
          $: { name: 'android:windowTranslucentStatus' },
        },
        {
          _: 'false',
          $: { name: 'android:windowTranslucentNavigation' },
        },
      ],
    };

    // Splash screen theme using expo-splash-screen's base theme
    const splashTheme = {
      $: {
        name: 'Theme.App.SplashScreen',
        parent: 'Theme.SplashScreen',
      },
      item: [
        {
          _: '@color/splashscreen_background',
          $: { name: 'windowSplashScreenBackground' },
        },
        {
          _: '@drawable/splashscreen_icon',
          $: { name: 'windowSplashScreenAnimatedIcon' },
        },
        {
          _: '@style/AppTheme',
          $: { name: 'postSplashScreenTheme' },
        },
      ],
    };

    // Clear existing styles and add our corrected ones
    styles.resources.style = [appTheme, splashTheme];

    return config;
  });
};
