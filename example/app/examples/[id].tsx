import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { scanImage, type DetectedPlate } from 'react-native-alpr';
import { ScanResult } from '../../components/ScanResult';
import { toAlprConfig, useAlprSettings } from '../../contexts/AlprSettingsContext';
import { TEST_IMAGES, resolveTestImageUri } from '../../testImages';

export default function ExampleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const image = TEST_IMAGES.find((i) => i.id === id);
  const { settings } = useAlprSettings();
  const [uri, setUri] = useState<string | null>(null);
  const [plates, setPlates] = useState<DetectedPlate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!image) return;
    let cancelled = false;
    setPlates(null);
    setError(null);
    (async () => {
      try {
        const resolvedUri = await resolveTestImageUri(image.module);
        if (cancelled) return;
        setUri(resolvedUri);
        const result = await scanImage(resolvedUri, toAlprConfig(settings));
        if (!cancelled) setPlates(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [image, settings]);

  return (
    <>
      <Stack.Screen options={{ title: image?.plates ?? 'Example' }} />
      {uri ? <ScanResult uri={uri} plates={plates} error={error} /> : null}
    </>
  );
}
