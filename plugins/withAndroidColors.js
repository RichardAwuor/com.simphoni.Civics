
const { withAndroidColors } = require('@expo/config-plugins');

/**
 * Config plugin to ensure proper color resources are defined for Android
 */
module.exports = function withCustomAndroidColors(config) {
  return withAndroidColors(config, (config) => {
    const colors = config.modResults;

    // Ensure resources object exists
    if (!colors.resources) {
      colors.resources = {};
    }

    // Define all required color resources
    const colorResources = [
      { $: { name: 'colorPrimary' }, _: '#D32F2F' },
      { $: { name: 'colorPrimaryDark' }, _: '#B71C1C' },
      { $: { name: 'colorAccent' }, _: '#FF5252' },
      { $: { name: 'splashscreen_background' }, _: '#D32F2F' },
      { $: { name: 'colorOnPrimary' }, _: '#FFFFFF' },
      { $: { name: 'colorSecondary' }, _: '#FF5252' },
      { $: { name: 'colorOnSecondary' }, _: '#FFFFFF' },
    ];

    // Replace all colors with our defined ones
    colors.resources.color = colorResources;

    console.log('✅ Android colors configured');

    return config;
  });
};
