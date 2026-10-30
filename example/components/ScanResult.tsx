import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DetectedPlate } from 'react-native-alpr';

type Props = {
  uri: string;
  plates: DetectedPlate[] | null;
  error?: string | null;
};

export function ScanResult({ uri, plates, error }: Props) {
  const insets = useSafeAreaInsets();
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [viewSize, setViewSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setImageSize(null);
  }, [uri]);

  const scale =
    imageSize && viewSize
      ? Math.min(viewSize.width / imageSize.width, viewSize.height / imageSize.height)
      : 0;
  const displayedWidth = imageSize ? imageSize.width * scale : 0;
  const displayedHeight = imageSize ? imageSize.height * scale : 0;
  const offsetX = viewSize ? (viewSize.width - displayedWidth) / 2 : 0;
  const offsetY = viewSize ? (viewSize.height - displayedHeight) / 2 : 0;

  return (
    <View style={[styles.container, { paddingBottom: 16 + insets.bottom }]}>
      <View
        style={styles.imageContainer}
        onLayout={(e) => setViewSize(e.nativeEvent.layout)}
      >
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          onLoad={(e) => setImageSize(e.nativeEvent.source)}
        />
        {scale > 0 &&
          plates?.map((p, i) => (
            <View
              key={i}
              pointerEvents="none"
              style={[
                styles.box,
                {
                  left: offsetX + p.bbox.x * displayedWidth,
                  top: offsetY + p.bbox.y * displayedHeight,
                  width: p.bbox.width * displayedWidth,
                  height: p.bbox.height * displayedHeight,
                },
              ]}
            >
              {p.plate ? (
                <View style={styles.labelRow}>
                  <Text style={styles.label} numberOfLines={1}>
                    {p.plate}
                    {p.countryCode ? ` · ${p.countryCode}` : ''}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
      </View>

      <View style={[styles.results]}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : plates == null ? (
          <Text style={styles.status}>Scanning…</Text>
        ) : plates.length === 0 ? (
          <Text style={styles.status}>No plates found</Text>
        ) : (
          <FlatList
            data={plates}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.plate}>{item.plate || '(unreadable)'}</Text>
                <Text style={styles.meta}>
                  {item.country} · {Math.round(item.ocrConfidence * 100)}% confidence
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  imageContainer: { flex: 1, backgroundColor: 'black' },
  box: { position: 'absolute', borderWidth: 2, borderColor: '#FFD60A', borderRadius: 4 },
  labelRow: {
    position: 'absolute',
    bottom: '100%',
    left: -2,
    width: 240,
    marginBottom: 3,
    flexDirection: 'row',
  },
  label: {
    backgroundColor: '#FFD60A',
    color: '#1C1C1E',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  results: {
    maxHeight: '35%',
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  status: { color: '#9ca3af', textAlign: 'center' },
  error: { color: '#f87171', textAlign: 'center' },
  row: { paddingVertical: 10 },
  plate: { color: 'white', fontSize: 18, fontWeight: '700' },
  meta: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
});
