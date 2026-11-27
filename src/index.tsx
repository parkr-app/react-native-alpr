import { createPermissionHook } from 'expo-modules-core';
import { requireModule } from './AlprModule';
import type {
  AlprConfig,
  BoundingBox,
  CameraPermissionResponse,
  DetectedPlate,
  FrameInfo,
  LoadModelsOptions,
} from './types';

export type {
  Accelerator,
  AlprCameraError,
  AlprConfig,
  AlprErrorCode,
  BoundingBox,
  CameraPermissionResponse,
  DetectedPlate,
  FrameInfo,
  LoadModelsOptions,
  PlateOverlayStyle,
} from './types';
export { PermissionStatus } from 'expo-modules-core';
export { AlprCameraView } from './AlprCameraView';
export type { AlprCameraViewProps } from './AlprCameraView';

export async function loadModels(options: LoadModelsOptions = {}): Promise<void> {
  return requireModule('loadModels').loadModels(options);
}

export async function scanImage(uri: string, config: AlprConfig = {}): Promise<DetectedPlate[]> {
  return requireModule('scanImage').scanImage(uri, config);
}

export function setTelemetryEnabled(enabled: boolean): void {
  requireModule('setTelemetryEnabled').setTelemetryEnabled(enabled);
}

export async function getCameraPermissionsAsync(): Promise<CameraPermissionResponse> {
  return requireModule('getCameraPermissionsAsync').getCameraPermissionsAsync();
}

export async function requestCameraPermissionsAsync(): Promise<CameraPermissionResponse> {
  return requireModule('requestCameraPermissionsAsync').requestCameraPermissionsAsync();
}

export const useCameraPermissions = createPermissionHook({
  getMethod: getCameraPermissionsAsync,
  requestMethod: requestCameraPermissionsAsync,
});

export function toViewRect(
  bbox: BoundingBox,
  frame: FrameInfo,
  view: { width: number; height: number }
): BoundingBox {
  const scale = Math.max(view.width / frame.frameWidth, view.height / frame.frameHeight);
  const displayedWidth = frame.frameWidth * scale;
  const displayedHeight = frame.frameHeight * scale;
  const offsetX = (view.width - displayedWidth) / 2;
  const offsetY = (view.height - displayedHeight) / 2;
  return {
    x: offsetX + bbox.x * displayedWidth,
    y: offsetY + bbox.y * displayedHeight,
    width: bbox.width * displayedWidth,
    height: bbox.height * displayedHeight,
  };
}
