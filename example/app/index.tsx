import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useIsFocused } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlprCameraView, useCameraPermissions, type DetectedPlate } from 'react-native-alpr';
import { SettingsModal } from '../components/SettingsModal';
import { useAlprSettings } from '../contexts/AlprSettingsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ZOOM_LEVELS = [1, 2, 3, 5, 8];
const SCAN_REGION = { x: 0.05, y: 0.38, width: 0.9, height: 0.3 };
const KEEP_AWAKE_TAG = 'scan';

export default function ScanScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { settings: config, showFps, mockCamera, mockImage, restrictRegion } = useAlprSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [plates, setPlates] = useState<DetectedPlate[]>([]);
  const [scanned, setScanned] = useState<DetectedPlate | null>(null);
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(1);
  const isFocused = useIsFocused();
  const scanning = isFocused && !showSettings && !scanned && (mockCamera || !!permission?.granted);

  useEffect(() => {
    if (!config.singleScan) setScanned(null);
  }, [config.singleScan]);

  useEffect(() => {
    if (!scanning) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [scanning]);

  if (!mockCamera && !permission?.granted) {
    const blocked = permission?.canAskAgain === false;
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          {blocked
            ? 'Camera access was denied. Enable it in Settings to scan plates.'
            : 'Camera access is needed to scan plates.'}
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => (blocked ? Linking.openSettings() : requestPermission())}
        >
          <Text style={styles.primaryButtonText}>{blocked ? 'Open Settings' : 'Grant permission'}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => setShowSettings(true)}>
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </Pressable>
        <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AlprCameraView
        style={StyleSheet.absoluteFill}
        isActive={!showSettings && !scanned}
        detectionThreshold={config.detectionThreshold}
        ocrThreshold={config.ocrThreshold}
        accelerator={config.accelerator}
        showFps={showFps}
        torch={torch}
        zoom={zoom}
        scanRegion={restrictRegion ? SCAN_REGION : undefined}
        mockImage={mockCamera ? mockImage : undefined}
        onPlates={setPlates}
        onScan={config.singleScan ? setScanned : undefined}
      />

      <View style={[styles.sideBar, { top: top + 8 }]}>
        <Pressable style={styles.chip} onPress={() => setShowSettings(true)}>
          <Ionicons name="settings-sharp" size={20} color="white" />
        </Pressable>
        {ZOOM_LEVELS.map((level) => (
          <Pressable
            key={level}
            style={[styles.chip, zoom === level && styles.chipActive]}
            onPress={() => setZoom(level)}
          >
            <Text style={[styles.chipText, zoom === level && styles.chipTextActive]}>{level}×</Text>
          </Pressable>
        ))}
        <Pressable style={[styles.chip, torch && styles.chipActive]} onPress={() => setTorch(!torch)}>
          <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={20} color={torch ? '#111827' : 'white'} />
        </Pressable>
      </View>

      {scanned ? (
        <View style={[styles.readout, { bottom: bottom + 16 }]}>
          <Text style={styles.scannedText}>
            {scanned.plate}
            {scanned.countryCode ? ` · ${scanned.countryCode}` : ''}
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => setScanned(null)}>
            <Text style={styles.primaryButtonText}>Scan again</Text>
          </Pressable>
        </View>
      ) : plates.length > 0 ? (
        <View style={[styles.readout, { bottom: bottom + 16 }]} pointerEvents="none">
          {plates.map((plate) => (
            <Text key={plate.plate} style={styles.readoutText} numberOfLines={1}>
              {plate.plate}
              {plate.countryCode ? ` · ${plate.countryCode}` : ''} · {Math.round(plate.ocrConfidence * 100)}%
            </Text>
          ))}
        </View>
      ) : null}

      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'black',
  },
  permissionText: { color: 'white', textAlign: 'center', marginBottom: 16 },
  primaryButton: {
    backgroundColor: '#FFD60A',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#1C1C1E', fontWeight: '700' },
  secondaryButton: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 12 },
  secondaryButtonText: { color: 'white', fontWeight: '600' },
  sideBar: {
    position: 'absolute',
    right: 16,
    gap: 8,
  },
  chip: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,24,39,0.85)',
    borderRadius: 999,
  },
  chipActive: { backgroundColor: '#FFD60A' },
  chipText: { color: 'white', fontWeight: '600' },
  chipTextActive: { color: '#1C1C1E' },
  readout: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(17,24,39,0.85)',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  readoutText: { color: 'white', fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  scannedText: { color: 'white', fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
});
