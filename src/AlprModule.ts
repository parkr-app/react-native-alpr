import { requireOptionalNativeModule, UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';
import type { AlprConfig, CameraPermissionResponse, DetectedPlate } from './types';

export interface AlprNativeModule {
  loadModels(config: AlprConfig): Promise<void>;
  scanImage(uri: string, config?: AlprConfig): Promise<DetectedPlate[]>;
  setTelemetryEnabled(enabled: boolean): void;
  setFrameworkVersion(version: string): void;
  getCameraPermissionsAsync(): Promise<CameraPermissionResponse>;
  requestCameraPermissionsAsync(): Promise<CameraPermissionResponse>;
}

let cached: AlprNativeModule | null | undefined;

export function getNativeModule(): AlprNativeModule | null {
  if (cached === undefined) {
    cached = requireOptionalNativeModule<AlprNativeModule>('Alpr');
    const { major, minor, patch } = Platform.constants.reactNativeVersion;
    cached?.setFrameworkVersion(`${major}.${minor}.${patch}`);
  }
  return cached;
}

export function requireModule(methodName: string): AlprNativeModule {
  const module = getNativeModule();
  if (!module) {
    throw new UnavailabilityError('react-native-alpr', methodName);
  }
  return module;
}
