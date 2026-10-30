import { useCallback, useState } from 'react';
import { Image, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scanImage, type DetectedPlate } from 'react-native-alpr';
import { ScanResult } from '../components/ScanResult';
import { toAlprConfig, useAlprSettings } from '../contexts/AlprSettingsContext';
import { TEST_IMAGE_SECTIONS, resolveTestImageUri } from '../testImages';

export default function ExamplesScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { settings } = useAlprSettings();
  const [uri, setUri] = useState<string | null>(null);
  const [plates, setPlates] = useState<DetectedPlate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectImage = useCallback(async (module: number) => {
    const resolvedUri = await resolveTestImageUri(module);
    setUri(resolvedUri);
    setPlates(null);
    setError(null);
    try {
      setPlates(await scanImage(resolvedUri, toAlprConfig(settings)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [settings]);

  if (uri) {
    return (
      <View style={styles.container}>
        <ScanResult uri={uri} plates={plates} error={error} />
        <Pressable
          style={[styles.closeButton, { top: top + 16 }]}
          onPress={() => setUri(null)}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SectionList
      style={styles.listBackground}
      contentContainerStyle={[styles.list, { paddingTop: top + 8, paddingBottom: 20 + bottom }]}
      sections={TEST_IMAGE_SECTIONS}
      keyExtractor={({ id }) => id}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
      )}
      renderItem={({ item: { plates, note, module, thumbnail } }) => (
        <Pressable style={styles.row} onPress={() => selectImage(module)}>
          <Image source={thumbnail} style={styles.thumbnail} />
          <View style={styles.rowBody}>
            <Text style={styles.rowText}>{plates}</Text>
            {note ? <Text style={styles.rowNote}>{note}</Text> : null}
          </View>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  listBackground: { backgroundColor: '#f3f4f6' },
  list: { padding: 16, flexGrow: 1 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    paddingRight: 16,
    marginBottom: 10,
  },
  thumbnail: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#e5e7eb' },
  rowBody: { flex: 1, marginLeft: 12 },
  rowText: { fontSize: 16, color: '#111827', fontWeight: '500' },
  rowNote: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  rowChevron: { fontSize: 18, color: '#9ca3af', marginLeft: 8 },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,24,39,0.85)',
  },
  closeButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
