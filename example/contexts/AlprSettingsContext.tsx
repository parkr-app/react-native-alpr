import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Linking, Platform, Settings } from 'react-native';
import type { Accelerator, AlprConfig, PlateOverlayStyle } from 'react-native-alpr';
import { DEFAULT_MOCK_CAMERA_IMAGE, MOCK_CAMERA_IMAGES } from '../testImages';

type ScanSettings = {
  detectionThreshold: number;
  ocrThreshold: number;
  accelerator: Accelerator;
  singleScan: boolean;
};

const DEFAULT_SETTINGS: ScanSettings = {
  detectionThreshold: 0.4,
  ocrThreshold: 0.3,
  accelerator: 'gpu',
  singleScan: false,
};

export type OverlaySettings = {
  showOverlay: boolean;
  showRegion: boolean;
  boxColor: string;
  boxBorderWidth: number;
  boxCornerRadius: number;
  labelBackgroundColor: string;
  labelTextColor: string;
  labelFontSize: number;
  showLabel: boolean;
  showPlate: boolean;
  showCountry: boolean;
  showConfidence: boolean;
};

export const DEFAULT_OVERLAY: OverlaySettings = {
  showOverlay: true,
  showRegion: true,
  boxColor: '#FFD60A',
  boxBorderWidth: 3,
  boxCornerRadius: 6,
  labelBackgroundColor: '#FFD60A',
  labelTextColor: '#1C1C1E',
  labelFontSize: 13,
  showLabel: true,
  showPlate: true,
  showCountry: true,
  showConfidence: false,
};

export function toOverlayStyle({ showOverlay, showRegion, ...style }: OverlaySettings): PlateOverlayStyle {
  return style;
}

type AlprSettingsContextValue = {
  settings: ScanSettings;
  setSettings: (settings: ScanSettings) => void;
  showFps: boolean;
  setShowFps: (showFps: boolean) => void;
  mockCamera: boolean;
  setMockCamera: (mockCamera: boolean) => void;
  mockImage: number;
  restrictRegion: boolean;
  setRestrictRegion: (restrictRegion: boolean) => void;
  overlay: OverlaySettings;
  setOverlay: (overlay: OverlaySettings) => void;
};

export function toAlprConfig(settings: ScanSettings): AlprConfig {
  return {
    detectionThreshold: settings.detectionThreshold,
    ocrThreshold: settings.ocrThreshold,
    accelerator: settings.accelerator,
  };
}

function mockImageId(value: string | null | undefined): string | null {
  if (!value || value === '0') return null;
  return value in MOCK_CAMERA_IMAGES ? value : DEFAULT_MOCK_CAMERA_IMAGE;
}

const AlprSettingsContext = createContext<AlprSettingsContextValue | null>(null);

export function AlprSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showFps, setShowFps] = useState(() => Platform.OS !== 'ios' || String(Settings.get('alprFps') ?? '') !== '0');
  const [mockImageName, setMockImageName] = useState(() =>
    Platform.OS === 'ios' ? mockImageId(String(Settings.get('alprMock') ?? '')) : null
  );
  const mockCamera = mockImageName != null;
  const setMockCamera = (enabled: boolean) => setMockImageName(enabled ? DEFAULT_MOCK_CAMERA_IMAGE : null);
  const [restrictRegion, setRestrictRegion] = useState(false);
  const [overlay, setOverlay] = useState(DEFAULT_OVERLAY);

  useEffect(() => {
    const apply = (url: string | null | undefined) => {
      const params = Object.fromEntries(
        (url?.split('?')[1] ?? '').split('&').map((pair) => pair.split('=').map(decodeURIComponent))
      );
      if ('mock' in params) setMockImageName(mockImageId(params.mock));
      if ('fps' in params) setShowFps(params.fps !== '0');
    };
    Linking.getInitialURL().then(apply);
    const subscription = Linking.addEventListener('url', ({ url }) => apply(url));
    return () => subscription.remove();
  }, []);

  return (
    <AlprSettingsContext.Provider
      value={{
        settings,
        setSettings,
        showFps,
        setShowFps,
        mockCamera,
        setMockCamera,
        mockImage: MOCK_CAMERA_IMAGES[mockImageName ?? DEFAULT_MOCK_CAMERA_IMAGE]!,
        restrictRegion,
        setRestrictRegion,
        overlay,
        setOverlay,
      }}
    >
      {children}
    </AlprSettingsContext.Provider>
  );
}

export function useAlprSettings(): AlprSettingsContextValue {
  const ctx = useContext(AlprSettingsContext);
  if (!ctx) throw new Error('useAlprSettings must be used within an AlprSettingsProvider');
  return ctx;
}
