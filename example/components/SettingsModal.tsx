import Slider from '@react-native-community/slider';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useAlprSettings } from '../contexts/AlprSettingsContext';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsModal({ visible, onClose }: Props) {
  const {
    settings: config,
    setSettings: onChange,
    showFps,
    setShowFps,
    mockCamera,
    setMockCamera,
    restrictRegion,
    setRestrictRegion,
  } = useAlprSettings();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Settings</Text>

          <Text style={styles.label}>
            Detection threshold: {config.detectionThreshold.toFixed(2)}
          </Text>
          <Slider
            minimumValue={0}
            maximumValue={1}
            value={config.detectionThreshold}
            onValueChange={(v) => onChange({ ...config, detectionThreshold: v })}
          />

          <Text style={styles.label}>OCR threshold: {config.ocrThreshold.toFixed(2)}</Text>
          <Slider
            minimumValue={0}
            maximumValue={1}
            value={config.ocrThreshold}
            onValueChange={(v) => onChange({ ...config, ocrThreshold: v })}
          />

          <View style={styles.row}>
            <Text style={[styles.label, styles.rowLabel]}>CPU only (no GPU / Neural Engine)</Text>
            <Switch
              value={config.accelerator === 'cpu'}
              onValueChange={(cpu) => onChange({ ...config, accelerator: cpu ? 'cpu' : 'gpu' })}
            />
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, styles.rowLabel]}>Scan one plate and stop</Text>
            <Switch value={config.singleScan} onValueChange={(singleScan) => onChange({ ...config, singleScan })} />
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, styles.rowLabel]}>Show FPS</Text>
            <Switch value={showFps} onValueChange={setShowFps} />
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, styles.rowLabel]}>Restrict scan area</Text>
            <Switch value={restrictRegion} onValueChange={setRestrictRegion} />
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, styles.rowLabel]}>Use test image instead of camera</Text>
            <Switch value={mockCamera} onValueChange={setMockCamera} />
          </View>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 36,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, color: '#374151', marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  rowLabel: { marginTop: 0, flex: 1, marginRight: 12 },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: { color: 'white', fontWeight: '600' },
});
