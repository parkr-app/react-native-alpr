const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
  withInfoPlist,
} = require('expo/config-plugins');
const pkg = require('./package.json');
const { verifyLicenseKey } = require('./plugin/license');
const { sendBuildTelemetry } = require('./plugin/telemetry');

const DEFAULT_CAMERA_PERMISSION = 'Allow $(PRODUCT_NAME) to access your camera to scan license plates.';
const LICENSE_META = 'app.parkr.alpr.LICENSE_KEY';
const TELEMETRY_META = 'app.parkr.alpr.TELEMETRY_ENABLED';

function licenseState(key, appId, platform) {
  const result = verifyLicenseKey(key, appId);
  if (!result.valid) {
    console.warn(
      `\u001b[33mreact-native-alpr: ${result.reason} for ${appId} (${platform}). ` +
        'Pro features will be disabled in release builds. Get a key or a 30-day trial at https://alpr.parkr.app\u001b[0m'
    );
    return 'unlicensed';
  }
  return result.payload.trial ? 'trial' : 'licensed';
}

function expoSdkVersion(config) {
  return config.sdkVersion ?? (() => {
    try {
      return require('expo/package.json').version;
    } catch {
      return undefined;
    }
  })();
}

const withAlpr = (config, props = {}) => {
  const { cameraPermission, licenseKey, telemetry } = props;

  config = withInfoPlist(config, (config) => {
    if (cameraPermission !== false) {
      config.modResults.NSCameraUsageDescription =
        cameraPermission || config.modResults.NSCameraUsageDescription || DEFAULT_CAMERA_PERMISSION;
    }
    if (licenseKey) config.modResults.AlprLicenseKey = licenseKey;
    if (typeof telemetry === 'boolean') config.modResults.AlprTelemetryEnabled = telemetry;
    return config;
  });

  config = withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    if (licenseKey) AndroidConfig.Manifest.addMetaDataItemToMainApplication(app, LICENSE_META, licenseKey);
    if (typeof telemetry === 'boolean') {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(app, TELEMETRY_META, String(telemetry));
    }
    return config;
  });

  for (const platform of ['ios', 'android']) {
    config = withDangerousMod(config, [
      platform,
      async (config) => {
        const appId = platform === 'ios' ? config.ios?.bundleIdentifier : config.android?.package;
        if (!appId) return config;
        const state = licenseState(licenseKey, appId, platform);
        await sendBuildTelemetry({
          source: 'expo-prebuild',
          appId,
          platform,
          buildType: process.env.EAS_BUILD_PROFILE ?? 'prebuild',
          sdkVersion: pkg.version,
          framework: 'expo',
          frameworkVersion: expoSdkVersion(config),
          licenseState: state,
          eas: Boolean(process.env.EAS_BUILD),
        });
        return config;
      },
    ]);
  }

  return config;
};

module.exports = createRunOncePlugin(withAlpr, pkg.name, pkg.version);
