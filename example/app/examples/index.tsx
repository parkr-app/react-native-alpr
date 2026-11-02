import { useRouter } from 'expo-router';
import { Image, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TEST_IMAGE_SECTIONS } from '../../testImages';

export default function ExamplesScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();

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
      renderItem={({ item: { id, plates, note, thumbnail } }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/examples/${id}`)}>
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
});
