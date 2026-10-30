import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scanImage, type DetectedPlate } from 'react-native-alpr';
import { ScanResult } from '../components/ScanResult';
import { toAlprConfig, useAlprSettings } from '../contexts/AlprSettingsContext';

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const { settings } = useAlprSettings();
  const [uri, setUri] = useState<string | null>(null);
  const [plates, setPlates] = useState<DetectedPlate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickAndScan = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    setUri(result.assets[0].uri);
    setPlates(null);
    setError(null);
    try {
      setPlates(await scanImage(result.assets[0].uri, toAlprConfig(settings)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [settings]);

  return (
    <View style={[styles.container, { paddingBottom: 16 + insets.bottom }]}>
      {uri ? (
        <ScanResult uri={uri} plates={plates} error={error} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Pick a photo to scan for license plates.</Text>
        </View>
      )}

      <Pressable
        style={[styles.uploadButton]}
        onPress={pickAndScan}
      >
        <Text style={styles.uploadButtonText}>Upload photo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  placeholderText: { color: '#9ca3af', textAlign: 'center', fontSize: 15 },
  uploadButton: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: 'rgba(17,24,39,0.85)',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  uploadButtonText: { color: 'white', fontWeight: '600' },
});
