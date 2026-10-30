import { requireNativeViewManager } from 'expo-modules-core';
import { useEffect, useMemo, useRef, type ComponentType } from 'react';
import { Image, processColor, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { getNativeModule } from './AlprModule';
import type { Accelerator, AlprCameraError, BoundingBox, DetectedPlate, FrameInfo, PlateOverlayStyle } from './types';

export type AlprCameraViewProps = {
  style?: StyleProp<ViewStyle>;
  isActive?: boolean;
  throttle?: number;
  showFps?: boolean;
  showOverlay?: boolean;
  mockImage?: string | number;
  torch?: boolean;
  zoom?: number;
  scanRegion?: BoundingBox;
  showScanRegion?: boolean;
  overlayStyle?: PlateOverlayStyle;
  detectionThreshold?: number;
  ocrThreshold?: number;
  accelerator?: Accelerator;
  /** Every plate read in the current frame, unsmoothed. */
  onPlatesRaw?: (plates: DetectedPlate[], frame: FrameInfo) => void;
  /** Confirmed plates in view, with consensus text and smoothed boxes. */
  onPlates?: (plates: DetectedPlate[], frame: FrameInfo) => void;
  /** Each plate once, when several frames agree. For continuous scanning. */
  onPlate?: (plate: DetectedPlate) => void;
  /** One plate per activation, once the reads are certain. For scanning a single plate. */
  onScan?: (plate: DetectedPlate) => void;
  onError?: (error: AlprCameraError) => void;
};

type NativeOverlayStyle = Omit<PlateOverlayStyle, 'boxColor' | 'labelBackgroundColor' | 'labelTextColor'> & {
  boxColor?: number;
  labelBackgroundColor?: number;
  labelTextColor?: number;
};

type PlatesEvent = { nativeEvent: { plates: DetectedPlate[] } & FrameInfo };

type NativeProps = Omit<
  AlprCameraViewProps,
  'onPlatesRaw' | 'onPlates' | 'onPlate' | 'onScan' | 'onError' | 'overlayStyle' | 'mockImage'
> & {
  overlayStyle?: NativeOverlayStyle;
  mockImage?: string;
  recognizesPlates: boolean;
  scansPlates: boolean;
  onPlatesRaw?: (event: PlatesEvent) => void;
  onPlates?: (event: PlatesEvent) => void;
  onPlate?: (event: { nativeEvent: { plate: DetectedPlate } }) => void;
  onScan?: (event: { nativeEvent: { plate: DetectedPlate } }) => void;
  onError?: (event: { nativeEvent: AlprCameraError }) => void;
};

let NativeView: ComponentType<NativeProps> | null | undefined;

function getNativeView(): ComponentType<NativeProps> | null {
  if (NativeView === undefined) {
    NativeView = getNativeModule() ? requireNativeViewManager<NativeProps>('Alpr') : null;
  }
  return NativeView;
}

function toNativeColor(color: ColorValue | undefined): number | undefined {
  if (color == null) return undefined;
  const processed = processColor(color);
  return typeof processed === 'number' ? processed : undefined;
}

function toNativeOverlayStyle(style: PlateOverlayStyle | undefined): NativeOverlayStyle | undefined {
  if (!style) return undefined;
  return {
    ...style,
    boxColor: toNativeColor(style.boxColor),
    labelBackgroundColor: toNativeColor(style.labelBackgroundColor),
    labelTextColor: toNativeColor(style.labelTextColor),
  };
}

function resolveImageUri(source: string | number | undefined): string | undefined {
  if (source == null) return undefined;
  if (typeof source === 'string') return source;
  return Image.resolveAssetSource(source)?.uri;
}

export function AlprCameraView({
  isActive = true,
  throttle = 200,
  showFps = false,
  showOverlay = true,
  showScanRegion = true,
  torch = false,
  zoom = 1,
  overlayStyle,
  mockImage,
  onPlatesRaw,
  onPlates,
  onPlate,
  onScan,
  onError,
  ...rest
}: AlprCameraViewProps) {
  const Native = getNativeView();
  const nativeOverlayStyle = useMemo(() => toNativeOverlayStyle(overlayStyle), [overlayStyle]);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!Native) {
      onErrorRef.current?.({ code: 'ERR_CAMERA', message: 'react-native-alpr is not available on this platform.' });
    }
  }, [Native]);

  if (!Native) return <View style={rest.style} />;

  return (
    <Native
      {...rest}
      isActive={isActive}
      throttle={throttle}
      showFps={showFps}
      showOverlay={showOverlay}
      showScanRegion={showScanRegion}
      torch={torch}
      zoom={zoom}
      overlayStyle={nativeOverlayStyle}
      mockImage={resolveImageUri(mockImage)}
      recognizesPlates={!!onPlate}
      scansPlates={!!onScan}
      onPlatesRaw={({ nativeEvent: { plates, frameWidth, frameHeight } }) => onPlatesRaw?.(plates, { frameWidth, frameHeight })}
      onPlates={({ nativeEvent: { plates, frameWidth, frameHeight } }) => onPlates?.(plates, { frameWidth, frameHeight })}
      onPlate={(event) => onPlate?.(event.nativeEvent.plate)}
      onScan={(event) => onScan?.(event.nativeEvent.plate)}
      onError={(event) => onError?.(event.nativeEvent)}
    />
  );
}
