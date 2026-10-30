const { withPodfile } = require('expo/config-plugins');

// With ALPR_CORE_DIR set at pod install, AlprKit builds from that core checkout instead of the xcframework.
const LINE = "  pod 'AlprKit', :path => File.join(ENV['ALPR_CORE_DIR'], 'ios') unless ENV['ALPR_CORE_DIR'].to_s.empty?";

module.exports = function withAlprCoreSource(config) {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents.replace(/\n\s*pod 'AlprKit', .*(?=\n)/, '');
    config.modResults.contents = contents.replace(/(\n\s*use_expo_modules!.*\n)/, `$1${LINE}\n`);
    return config;
  });
};
