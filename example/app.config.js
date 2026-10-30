module.exports = ({ config }) => ({
  ...config,
  plugins: config.plugins.map((plugin) =>
    Array.isArray(plugin) && plugin[0] === 'react-native-alpr'
      ? ['react-native-alpr', { ...plugin[1], licenseKey: process.env.ALPR_LICENSE_KEY }]
      : plugin
  ),
});
