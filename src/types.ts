import type { ColorValue } from 'react-native';
import type { PermissionResponse } from 'expo-modules-core';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedPlate {
  plate: string;
  ocrConfidence: number;
  detectionConfidence: number;
  bbox: BoundingBox;
  country: string;
  countryCode: string | null;
  countryConfidence: number;
}

export interface FrameInfo {
  frameWidth: number;
  frameHeight: number;
}

export type Accelerator = 'gpu' | 'cpu';

export interface AlprConfig {
  detectionThreshold?: number;
  ocrThreshold?: number;
  region?: BoundingBox;
  accelerator?: Accelerator;
}

export interface PlateOverlayStyle {
  boxColor?: ColorValue;
  boxBorderWidth?: number;
  boxCornerRadius?: number;
  labelBackgroundColor?: ColorValue;
  labelTextColor?: ColorValue;
  labelFontSize?: number;
  showLabel?: boolean;
  showPlate?: boolean;
  showCountry?: boolean;
  showConfidence?: boolean;
}

export type AlprFeature =
  | 'scanImage'
  | 'throttle'
  | 'zoom'
  | 'torch'
  | 'styling'
  | 'accelerator'
  | 'region'
  | 'thresholds'
  | 'onPlate'
  | 'onScan'
  | 'showOverlay'
  | 'showScanRegion';

export type AlprErrorCode =
  | 'ERR_LICENSE_REQUIRED'
  | 'ERR_LICENSE_INVALID'
  | 'ERR_MODEL_LOAD'
  | 'ERR_CAMERA'
  | 'ERR_FILE';

export interface AlprCameraError {
  code: AlprErrorCode;
  message: string;
}

export type CameraPermissionResponse = PermissionResponse;
